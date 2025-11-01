import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Commitment {
  id: string;
  title: string;
  due_date: string;
  due_time: string;
}

export const useNotifications = (userId: string) => {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return "denied";
  };

  const scheduleNotification = (commitment: Commitment) => {
    const dueDateTime = new Date(`${commitment.due_date}T${commitment.due_time}`);
    const now = new Date();
    
    // Calculate time differences in milliseconds
    const timeUntilDue = dueDateTime.getTime() - now.getTime();
    
    // Schedule notifications at 1hr, 30min, 5min, and 1min before
    const intervals = [
      { time: 60 * 60 * 1000, label: "1 hour" },
      { time: 30 * 60 * 1000, label: "30 minutes" },
      { time: 5 * 60 * 1000, label: "5 minutes" },
      { time: 1 * 60 * 1000, label: "1 minute" },
    ];

    intervals.forEach(({ time, label }) => {
      const notificationTime = timeUntilDue - time;
      
      if (notificationTime > 0) {
        setTimeout(() => {
          if (permission === "granted") {
            new Notification(`Commitment Reminder - ${label} left`, {
              body: commitment.title,
              icon: "/favicon.ico",
              tag: commitment.id,
            });
          }
        }, notificationTime);
      }
    });
  };

  const setupNotifications = async () => {
    const { data: commitments } = await supabase
      .from("commitments")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false);

    if (commitments && permission === "granted") {
      commitments.forEach((commitment) => {
        scheduleNotification(commitment);
      });
    }
  };

  return {
    permission,
    requestPermission,
    setupNotifications,
    scheduleNotification,
  };
};
