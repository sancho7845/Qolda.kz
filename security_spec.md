# Security Specifications for Qolda.kz

This document specifies the data invariants, authorization gates, and potential malicious payloads designed to test our attribute-based access control (ABAC) and zero-trust policies.

## 1. Data Invariants

1. **User Identity Security**:
   - Users cannot sign up or register as an administrator (`isAdmin: true`) or self-inject privileges.
   - Users cannot edit another user's profile (`users/{userId}`). Only the owner (`request.auth.uid == userId`) or an admin can modify profiles.
   - Users cannot clear their ban status (`isBanned: false`) or alter stats fields manually if they are restricted.

2. **Task Integrity**:
   - A task cannot exist without a valid creator UID (`creatorId == request.auth.uid`).
   - The initial status of a task must be `"new"`.
   - The status can only change linearly: `"new" -> "in_progress" -> "completed"`.
   - Only the creator of the task can delete it, and only if its status is still `"new"`.
   - A task cannot be accepted by its creator (`volunteerId != creatorId`).
   - Once a task's status is `"completed"`, it is terminal and cannot be further modified (except by admins).
   - Timestamp updates must match the exact server-side timestamp (`request.time`).

3. **Review Consistency**:
   - A user cannot review themselves (`reviewerId != targetUserId`).
   - Reviews can only be left for completed tasks where the reviewer and target were the seeker and volunteer respectively.
   - The rating must be an integer between 1 and 5.

4. **Notifications**:
   - A user can only read and manage their own notifications (`userId == request.auth.uid`).

5. **Reports**:
   - Flagging items is open to all logged-in users, but report processing/modifying is restricted to Admins.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent bypasses, updates, or poisoning actions that our Firestore security rules explicitly reject with `PERMISSION_DENIED`:

### Payload 1: Admin Self-Promotion (Privilege Escalation)
* **Target Path**: `/users/attacker_uid` (Create or Update)
* **Payload**:
  ```json
  {
    "uid": "attacker_uid",
    "name": "Attacker",
    "email": "attacker@qolda.kz",
    "city": "Almaty",
    "isAdmin": true,
    "isBanned": false
  }
  ```
* **Security Rule Gate**: Blocked by preventing users from setting `isAdmin: true` during profile creation/update (forcing `incoming().isAdmin == false` unless written by an existing Admin).

### Payload 2: Ban Circumvention
* **Target Path**: `/users/suspended_uid`
* **Payload**:
  ```json
  {
    "isBanned": false
  }
  ```
* **Security Rule Gate**: Blocked by checking `request.auth.uid == userId` and strictly locking `isBanned` field modifier (unless Admin).

### Payload 3: Impersonating Task Creator
* **Target Path**: `/tasks/test_task_1` (Create)
* **Payload**:
  ```json
  {
    "id": "test_task_1",
    "title": "Need Food Delivery",
    "description": "Please deliver groceries",
    "category": "delivery",
    "priority": "high",
    "deadline": "2026-06-01T12:00:00Z",
    "status": "new",
    "city": "Nur-Sultan",
    "creatorId": "innocent_victim_uid",
    "creatorName": "Innocent User",
    "createdAt": "request.time",
    "updatedAt": "request.time"
  }
  ```
* **Security Rule Gate**: Reject if `incoming().creatorId != request.auth.uid`.

### Payload 4: Invalid Task ID (Path Variable Poisoning / DOS)
* **Target Path**: `/tasks/VERY_LONG_JUNK_CHARACTER_STRING_EXCEEDING_SIZE_LIMITS_OR_CONTAINING_SQL_INJECTION......`
* **Payload**: Any valid task data.
* **Security Rule Gate**: Rejected by `isValidId(taskId)` path variable checking.

### Payload 5: Creator Self-Accepting Task
* **Target Path**: `/tasks/my_own_task` (Update)
* **Payload**:
  ```json
  {
    "status": "in_progress",
    "volunteerId": "my_user_uid",
    "volunteerName": "My Name",
    "updatedAt": "request.time"
  }
  ```
* **Security Rule Gate**: Reject if `incoming().volunteerId == existing().creatorId`.

### Payload 6: Forceful Status Jump (Shortcut State)
* **Target Path**: `/tasks/some_other_new_task` (Update)
* **Payload**:
  ```json
  {
    "status": "completed",
    "updatedAt": "request.time"
  }
  ```
* **Security Rule Gate**: Reject status changes directly to `"completed"` without task creator's rating confirmation/acceptance flow, or reject direct complete action if not authorized.

### Payload 7: Shadow Update Ghost Fields
* **Target Path**: `/tasks/my_active_task` (Update)
* **Payload**:
  ```json
  {
    "title": "Help elderly",
    "status": "in_progress",
    "ghostFieldInject": "maliciousValue"
  }
  ```
* **Security Rule Gate**: Rejected by `affectedKeys().hasOnly([...])` for allowed update actions.

### Payload 8: Self-Reviewing (Rating Inflation)
* **Target Path**: `/reviews/self_review_1` (Create)
* **Payload**:
  ```json
  {
    "id": "self_review_1",
    "taskId": "some_task",
    "reviewerId": "attacker_uid",
    "reviewerName": "Attacker",
    "targetUserId": "attacker_uid",
    "rating": 5,
    "text": "I am the best volunteer!",
    "createdAt": "request.time"
  }
  ```
* **Security Rule Gate**: Rejected if `incoming().reviewerId == incoming().targetUserId`.

### Payload 9: Invalid Star Ratings (Rating Poisoning)
* **Target Path**: `/reviews/test_review_9` (Create)
* **Payload**:
  ```json
  {
    "id": "test_review_9",
    "taskId": "some_task",
    "reviewerId": "attacker_uid",
    "reviewerName": "Attacker",
    "targetUserId": "volunteer_uid",
    "rating": 999,
    "text": "Broken review",
    "createdAt": "request.time"
  }
  ```
* **Security Rule Gate**: Rejected by `rating` range restriction (1 to 5).

### Payload 10: Stealing/Editing Someone Else's Notifications
* **Target Path**: `/notifications/victim_notif_1` (Update)
* **Payload**:
  ```json
  {
    "isRead": true
  }
  ```
* **Security Rule Gate**: Reject update if owner matches victim but `request.auth.uid != victim_uid`.

### Payload 11: Modifying Admin Reports
* **Target Path**: `/reports/flagged_report_1` (Update)
* **Payload**:
  ```json
  {
    "status": "resolved"
  }
  ```
* **Security Rule Gate**: Reject if `!isAdmin()`.

### Payload 12: Unverifiable Client Timestamps
* **Target Path**: `/tasks/test_task_12` (Create)
* **Payload**:
  ```json
  {
    "createdAt": "2020-01-01T00:00:00Z",
    "updatedAt": "request.time"
  }
  ```
* **Security Rule Gate**: Reject unless `incoming().createdAt == request.time`.

---

## 3. The Test Runner Specification

The test cases listed above will return `PERMISSION_DENIED` in our validation logic. We enforce that rules are perfectly hardened against these vulnerabilities.
