import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { Task, TaskCategory, TaskPriority, TaskStatus, UserProfile, Review, Notification, Report } from './types';

// generate random stable ID helper
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// --- TASKS SERVICES ---

export async function createTask(
  title: string,
  description: string,
  category: TaskCategory,
  priority: TaskPriority,
  deadline: string,
  city: string,
  creator: UserProfile,
  attachmentUrl?: string,
  attachmentName?: string,
  attachmentSize?: number
): Promise<string> {
  const taskId = generateId();
  const taskPath = `tasks/${taskId}`;
  const now = new Date().toISOString();

  const task: Task = {
    id: taskId,
    title,
    description,
    category,
    priority,
    deadline,
    status: TaskStatus.NEW,
    city,
    creatorId: creator.uid,
    creatorName: creator.name,
    creatorAvatar: creator.avatarId || 'avatar_1',
    volunteerId: null,
    volunteerName: null,
    volunteerAvatar: null,
    createdAt: now,
    updatedAt: now,
    ownerId: creator.uid,
    ownerName: creator.name,
    ownerEmail: creator.email || '',
    ownerPhone: creator.phone || '',
    attachmentUrl: attachmentUrl || '',
    attachmentName: attachmentName || '',
    attachmentSize: attachmentSize || 0
  };

  try {
    await setDoc(doc(db, 'tasks', taskId), task);
    return taskId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, taskPath);
  }
}

export async function updateTask(taskId: string, data: Partial<Task>): Promise<void> {
  const taskPath = `tasks/${taskId}`;
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      ...data,
      updatedAt: now
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, taskPath);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const taskPath = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, taskPath);
  }
}

export async function getTask(taskId: string): Promise<Task | null> {
  const taskPath = `tasks/${taskId}`;
  try {
    const docSnap = await getDoc(doc(db, 'tasks', taskId));
    if (docSnap.exists()) {
      return docSnap.data() as Task;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, taskPath);
  }
}

export async function getTasks(): Promise<Task[]> {
  const tasksCollection = 'tasks';
  const uid = auth.currentUser?.uid;
  const isAdminUser = uid === 'q2BisrMhIBdICRbrDPEp0Lr9iZu2';

  try {
    if (isAdminUser) {
      const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push(doc.data() as Task);
      });
      return tasks;
    } else if (uid) {
      // For standard users, load open tasks, tasks they created, and tasks they accepted
      const qNew = query(collection(db, 'tasks'), where('status', '==', 'new'));
      const qCreator = query(collection(db, 'tasks'), where('creatorId', '==', uid));
      const qVolunteer = query(collection(db, 'tasks'), where('volunteerId', '==', uid));

      const [snapNew, snapCreator, snapVolunteer] = await Promise.all([
        getDocs(qNew).catch(() => null),
        getDocs(qCreator).catch(() => null),
        getDocs(qVolunteer).catch(() => null)
      ]);

      const tasksMap = new Map<string, Task>();
      
      const addDocs = (snap: any) => {
        if (!snap) return;
        snap.forEach((doc: any) => {
          const t = doc.data() as Task;
          tasksMap.set(t.id, t);
        });
      };

      addDocs(snapNew);
      addDocs(snapCreator);
      addDocs(snapVolunteer);

      const tasks = Array.from(tasksMap.values());
      tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return tasks;
    } else {
      return [];
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, tasksCollection);
    return [];
  }
}

export function subscribeTasks(
  onUpdate: (tasks: Task[]) => void,
  onError: (err: any) => void
) {
  const uid = auth.currentUser?.uid;
  const isAdminUser = uid === 'q2BisrMhIBdICRbrDPEp0Lr9iZu2';

  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  if (isAdminUser) {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (querySnapshot) => {
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          tasks.push(doc.data() as Task);
        });
        onUpdate(tasks);
      },
      (error) => {
        onError(error);
      }
    );
  }

  const qNew = query(collection(db, 'tasks'), where('status', '==', 'new'));
  const qCreator = query(collection(db, 'tasks'), where('creatorId', '==', uid));
  const qVolunteer = query(collection(db, 'tasks'), where('volunteerId', '==', uid));

  const resultsMap = new Map<string, Map<string, Task>>();
  resultsMap.set('new', new Map());
  resultsMap.set('creator', new Map());
  resultsMap.set('volunteer', new Map());

  const triggerUpdate = () => {
    const finalMap = new Map<string, Task>();
    resultsMap.get('new')?.forEach((t, id) => finalMap.set(id, t));
    resultsMap.get('creator')?.forEach((t, id) => finalMap.set(id, t));
    resultsMap.get('volunteer')?.forEach((t, id) => finalMap.set(id, t));

    const merged = Array.from(finalMap.values());
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(merged);
  };

  const unsubNew = onSnapshot(qNew, (snap) => {
    const subMap = new Map<string, Task>();
    snap.forEach((doc) => {
      subMap.set(doc.id, doc.data() as Task);
    });
    resultsMap.set('new', subMap);
    triggerUpdate();
  }, (err) => {
    console.error('Error listening to open tasks:', err);
  });

  const unsubCreator = onSnapshot(qCreator, (snap) => {
    const subMap = new Map<string, Task>();
    snap.forEach((doc) => {
      subMap.set(doc.id, doc.data() as Task);
    });
    resultsMap.set('creator', subMap);
    triggerUpdate();
  }, (err) => {
    console.error('Error listening to created tasks:', err);
  });

  const unsubVolunteer = onSnapshot(qVolunteer, (snap) => {
    const subMap = new Map<string, Task>();
    snap.forEach((doc) => {
      subMap.set(doc.id, doc.data() as Task);
    });
    resultsMap.set('volunteer', subMap);
    triggerUpdate();
  }, (err) => {
    console.error('Error listening to volunteered tasks:', err);
  });

  return () => {
    unsubNew();
    unsubCreator();
    unsubVolunteer();
  };
}

// Accept a help request as volunteer
export async function acceptTask(
  taskId: string,
  volunteer: UserProfile
): Promise<void> {
  const taskPath = `tasks/${taskId}`;
  const now = new Date().toISOString();
  
  try {
    const taskDocRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskDocRef);
    if (!taskSnap.exists()) {
      throw new Error('Тапсырма табылмады');
    }
    const task = taskSnap.data() as Task;

    if (task.status !== TaskStatus.NEW) {
      throw new Error('Бұл тапсырма басталып кеткен немесе аяқталған');
    }
    if (task.creatorId === volunteer.uid) {
      throw new Error('Өз тапсырмаңызды қабылдай алмайсыз');
    }

    await updateDoc(taskDocRef, {
      status: TaskStatus.IN_PROGRESS,
      volunteerId: volunteer.uid,
      volunteerName: volunteer.name,
      volunteerAvatar: volunteer.avatarId || 'avatar_1',
      updatedAt: now
    });

    // Notify the help-seeker
    await createNotification(
      task.creatorId,
      'Тапсырмаңыз қабылданды! 🤝',
      `Сіздің "${task.title}" тапсырмаңызды ерікті ${volunteer.name} қабылдады. Көмектесу үшін байланысқа шығуы мүмкін немесе жаза аласыз.`,
      taskId,
      'task_accepted'
    );

    // Update volunteer's accepted counts inside Firestore transaction or update
    const volunteerRef = doc(db, 'users', volunteer.uid);
    await updateDoc(volunteerRef, {
      acceptedTasksCount: (volunteer.acceptedTasksCount || 0) + 1
    });

  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, taskPath);
  }
}

// Cancel accepted task prior to completion
export async function cancelTaskAcceptance(taskId: string): Promise<void> {
  const taskPath = `tasks/${taskId}`;
  const now = new Date().toISOString();
  try {
    const taskDocRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskDocRef);
    if (!taskSnap.exists()) {
      throw new Error('Тапсырма табылмады');
    }
    const task = taskSnap.data() as Task;

    if (task.status !== TaskStatus.IN_PROGRESS || !task.volunteerId) {
      throw new Error('Бұл тапсырма орындалу күйінде емес');
    }

    const prevVolunteerId = task.volunteerId;
    const prevVolunteerName = task.volunteerName;

    await updateDoc(taskDocRef, {
      status: TaskStatus.NEW,
      volunteerId: null,
      volunteerName: null,
      volunteerAvatar: null,
      updatedAt: now
    });

    // Notify help-seeker
    await createNotification(
      task.creatorId,
      'Ерікті бас тартты ⚠️',
      `Өкінішке орай, "${task.title}" тапсырмасынан ерікті ${prevVolunteerName} бас тартты. Тапсырма жаңа күйіне қайтарылды және басқа еріктілерге қолжетімді.`,
      taskId,
      'system'
    );

    // Decrement accepted count for volunteer
    const volRef = doc(db, 'users', prevVolunteerId);
    const volSnap = await getDoc(volRef);
    if (volSnap.exists()) {
      const volData = volSnap.data() as UserProfile;
      await updateDoc(volRef, {
        acceptedTasksCount: Math.max(0, (volData.acceptedTasksCount || 1) - 1)
      });
    }

  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, taskPath);
  }
}

// Complete helper request (Confirm completion by creator)
export async function completeTask(taskId: string): Promise<void> {
  const taskPath = `tasks/${taskId}`;
  const now = new Date().toISOString();
  try {
    const taskDocRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskDocRef);
    if (!taskSnap.exists()) {
      throw new Error('Тапсырма табылмады');
    }
    const task = taskSnap.data() as Task;

    if (task.status !== TaskStatus.IN_PROGRESS || !task.volunteerId) {
      throw new Error('Тек орындалып жатқан белсенді тапсырмаларды ғана аяқтауға болады');
    }

    await updateDoc(taskDocRef, {
      status: TaskStatus.COMPLETED,
      updatedAt: now
    });

    // Increment completed tasks count for volunteer
    const volunteerRef = doc(db, 'users', task.volunteerId);
    const volSnap = await getDoc(volunteerRef);
    if (volSnap.exists()) {
      const volData = volSnap.data() as UserProfile;
      await updateDoc(volunteerRef, {
        completedTasksCount: (volData.completedTasksCount || 0) + 1
      });
    }

    // Notify volunteer
    await createNotification(
      task.volunteerId,
      'Тапсырма аяқталды! 🎉',
      `Құттықтаймыз! Көмек сұраушы сіздің "${task.title}" тапсырмасын толығымен сәтті аяқтағаныңызды растады. Көмегіңіз үшін мың алғыс!`,
      taskId,
      'task_completed'
    );

  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, taskPath);
  }
}


// --- REVIEWS SYSTEM ---

export async function submitReview(
  taskId: string,
  reviewerId: string,
  reviewerName: string,
  reviewerAvatar: string,
  targetUserId: string,
  rating: number,
  text: string
): Promise<void> {
  const reviewId = generateId();
  const reviewPath = `reviews/${reviewId}`;
  const now = new Date().toISOString();

  const review: Review = {
    id: reviewId,
    taskId,
    reviewerId,
    reviewerName,
    reviewerAvatar,
    targetUserId,
    rating,
    text,
    createdAt: now
  };

  try {
    // 1. Submit review
    await setDoc(doc(db, 'reviews', reviewId), review);

    // 2. Fetch all reviews for target user to recalculate running average
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('targetUserId', '==', targetUserId));
    const querySnapshot = await getDocs(q);

    let totalRating = 0;
    let count = 0;
    querySnapshot.forEach((doc) => {
      const r = doc.data() as Review;
      totalRating += r.rating;
      count++;
    });

    const averageRating = count > 0 ? parseFloat((totalRating / count).toFixed(1)) : 5;

    // 3. Update target user profile
    const targetUserRef = doc(db, 'users', targetUserId);
    await updateDoc(targetUserRef, {
      rating: averageRating,
      reviewsCount: count
    });

    // 4. Notify targeted user
    await createNotification(
      targetUserId,
      'Жаңа пікір қалдырылды! ⭐',
      `${reviewerName} сізге ${rating} жұлдыздан пікір қалдырды: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
      taskId,
      'new_review'
    );

  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, reviewPath);
  }
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  const reviewsCollection = 'reviews';
  try {
    const q = query(
      collection(db, 'reviews'), 
      where('targetUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];
    querySnapshot.forEach((doc) => {
      reviews.push(doc.data() as Review);
    });
    return reviews;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, reviewsCollection);
  }
}


// --- REAL-TIME NOTIFICATIONS ---

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  taskId?: string,
  type: 'task_accepted' | 'task_completed' | 'new_review' | 'system' = 'system'
): Promise<string> {
  const notifId = generateId();
  const notifPath = `notifications/${notifId}`;
  
  const notif: Notification = {
    id: notifId,
    userId,
    title,
    message,
    taskId,
    type,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'notifications', notifId), notif);
    return notifId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, notifPath);
  }
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const notifCollection = 'notifications';
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push(doc.data() as Notification);
    });
    return notifications;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, notifCollection);
  }
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  const notifPath = `notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      isRead: true
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, notifPath);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notifCollection = 'notifications';
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
    const querySnapshot = await getDocs(q);
    
    // Process incrementally to stay 100% type-safe and within simple rules boundaries
    const promises: Promise<void>[] = [];
    querySnapshot.forEach((snapshot) => {
      promises.push(updateDoc(doc(db, 'notifications', snapshot.id), { isRead: true }));
    });
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, notifCollection);
  }
}


// --- ADMIN PANELS & MODERATIONS ---

export async function submitReport(
  reporterId: string,
  reporterName: string,
  targetType: 'user' | 'task',
  targetId: string,
  targetLabel: string,
  reason: string
): Promise<string> {
  const reportId = generateId();
  const reportPath = `reports/${reportId}`;
  
  const report: Report = {
    id: reportId,
    reporterId,
    reporterName,
    targetType,
    targetId,
    targetLabel,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'reports', reportId), report);
    return reportId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, reportPath);
  }
}

export async function getReports(): Promise<Report[]> {
  const reportsCollection = 'reports';
  try {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const reports: Report[] = [];
    querySnapshot.forEach((doc) => {
      reports.push(doc.data() as Report);
    });
    return reports;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, reportsCollection);
  }
}

export async function updateReportStatus(reportId: string, status: 'pending' | 'resolved'): Promise<void> {
  const reportPath = `reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'reports', reportId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, reportPath);
  }
}

export async function toggleUserBan(userId: string, isBanned: boolean): Promise<void> {
  const userPath = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), { isBanned });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function getUsers(): Promise<UserProfile[]> {
  const usersCollection = 'users';
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, usersCollection);
  }
}

export async function getPlatformStats(): Promise<{
  totalTasks: number;
  newTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalUsers: number;
  totalVolunteers: number;
  totalReports: number;
}> {
  try {
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    const usersSnap = await getDocs(collection(db, 'users'));
    const reportsSnap = await getDocs(collection(db, 'reports'));

    let totalTasks = 0;
    let newTasks = 0;
    let activeTasks = 0;
    let completedTasks = 0;
    let totalUsers = 0;
    let totalVolunteers = 0;

    tasksSnap.forEach((doc) => {
      totalTasks++;
      const t = doc.data() as Task;
      if (t.status === TaskStatus.NEW) newTasks++;
      if (t.status === TaskStatus.IN_PROGRESS) activeTasks++;
      if (t.status === TaskStatus.COMPLETED) completedTasks++;
    });

    usersSnap.forEach((doc) => {
      totalUsers++;
      const u = doc.data() as UserProfile;
      if ((u.completedTasksCount || 0) > 0 || (u.acceptedTasksCount || 0) > 0) {
        totalVolunteers++;
      }
    });

    return {
      totalTasks,
      newTasks,
      activeTasks,
      completedTasks,
      totalUsers,
      totalVolunteers,
      totalReports: reportsSnap.size
    };
  } catch (error) {
    console.error('Failed to get platform stats: ', error);
    return {
      totalTasks: 0,
      newTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      totalUsers: 0,
      totalVolunteers: 0,
      totalReports: 0
    };
  }
}
