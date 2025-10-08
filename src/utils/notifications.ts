export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const scheduleCommitmentNotifications = (
  commitmentTitle: string,
  commitmentDateTime: Date
) => {
  const now = new Date();
  const timeUntilCommitment = commitmentDateTime.getTime() - now.getTime();

  // Skip if commitment is in the past
  if (timeUntilCommitment <= 0) return;

  // Schedule notification 1 hour before
  const oneHourBefore = timeUntilCommitment - 60 * 60 * 1000;
  if (oneHourBefore > 0) {
    setTimeout(() => {
      showNotification(
        "Upcoming Commitment - 1 Hour",
        `${commitmentTitle} is due in 1 hour! 🎯`
      );
    }, oneHourBefore);
  }

  // Schedule notification 30 minutes before
  const thirtyMinutesBefore = timeUntilCommitment - 30 * 60 * 1000;
  if (thirtyMinutesBefore > 0) {
    setTimeout(() => {
      showNotification(
        "Upcoming Commitment - 30 Minutes",
        `${commitmentTitle} is due in 30 minutes! ⏰`
      );
    }, thirtyMinutesBefore);
  }

  // Schedule notification 10 minutes before
  const tenMinutesBefore = timeUntilCommitment - 10 * 60 * 1000;
  if (tenMinutesBefore > 0) {
    setTimeout(() => {
      showNotification(
        "Upcoming Commitment - 10 Minutes",
        `${commitmentTitle} is due in 10 minutes! 🔔`
      );
    }, tenMinutesBefore);
  }

  // Schedule notification 5 minutes before
  const fiveMinutesBefore = timeUntilCommitment - 5 * 60 * 1000;
  if (fiveMinutesBefore > 0) {
    setTimeout(() => {
      showNotification(
        "Upcoming Commitment - 5 Minutes",
        `${commitmentTitle} is due in 5 minutes! 🚨`
      );
    }, fiveMinutesBefore);
  }

  // Schedule notification 1 minute before
  const oneMinuteBefore = timeUntilCommitment - 1 * 60 * 1000;
  if (oneMinuteBefore > 0) {
    setTimeout(() => {
      showNotification(
        "Upcoming Commitment - 1 Minute",
        `${commitmentTitle} is due in 1 minute! ⚡`
      );
    }, oneMinuteBefore);
  }

  // Schedule notification at exact time
  setTimeout(() => {
    showNotification(
      "Commitment Time! ⏰",
      `Time to complete: ${commitmentTitle}`
    );
  }, timeUntilCommitment);
};

export const showNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "commitment-reminder",
      requireInteraction: true,
    });
  }
};

export const scheduleAllTodayCommitments = (
  commitments: Array<{
    title: string;
    commitment_date: string;
    commitment_time: string;
    completed: boolean;
  }>
) => {
  commitments.forEach((commitment) => {
    if (!commitment.completed) {
      const [hours, minutes] = commitment.commitment_time.split(":");
      const commitmentDateTime = new Date(commitment.commitment_date);
      commitmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

      scheduleCommitmentNotifications(commitment.title, commitmentDateTime);
    }
  });
};
