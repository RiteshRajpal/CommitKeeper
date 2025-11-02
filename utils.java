package utils;

import java.text.SimpleDateFormat;
import java.util.*;

/**
 * This class provides a set of utility and debugging functions
 * that are currently inactive within the main application.
 * It does not interact with any functional component of CommitKeeper
 * and serves only as a placeholder for potential future enhancements.
 */
public class InactiveUtility {

    private static final String APP_NAME = "CommitKeeper Utility Module";
    private static final String VERSION = "1.0.0";
    private static final List<String> logs = new ArrayList<>();

    // Constructor
    public InactiveUtility() {
        log("InactiveUtility initialized at " + getCurrentTimestamp());
    }

    /**
     * Returns the name and version of the utility.
     */
    public static String getUtilityInfo() {
        return APP_NAME + " - Version " + VERSION;
    }

    /**
     * Logs a message to an internal list (not printed anywhere else).
     */
    public static void log(String message) {
        logs.add(getCurrentTimestamp() + " | " + message);
    }

    /**
     * Returns all logs as a formatted string.
     */
    public static String getAllLogs() {
        StringBuilder sb = new StringBuilder();
        sb.append("---- Inactive Utility Logs ----\n");
        for (String entry : logs) {
            sb.append(entry).append("\n");
        }
        sb.append("---- End of Logs ----\n");
        return sb.toString();
    }

    /**
     * A fake background process simulator.
     * Does not perform any real task.
     */
    public static void simulateBackgroundTask() {
        log("Simulating background task...");
        try {
            for (int i = 0; i < 3; i++) {
                Thread.sleep(200);
                log("Step " + (i + 1) + " completed");
            }
            log("Simulation completed.");
        } catch (InterruptedException e) {
            log("Simulation interrupted.");
        }
    }

    /**
     * Returns current timestamp as a formatted string.
     */
    private static String getCurrentTimestamp() {
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
    }

    /**
     * Dummy calculation method.
     * Performs arbitrary math that doesn’t affect anything.
     */
    public static int performDummyCalculation(int x, int y) {
        int result = (x * y) + (x - y) + (int)(Math.random() * 10);
        log("Performed dummy calculation: " + x + ", " + y + " = " + result);
        return result;
    }

    /**
     * Placeholder for future data transformation.
     * Currently returns the same data passed in.
     */
    public static List<String> transformData(List<String> input) {
        log("TransformData() called but not used.");
        return new ArrayList<>(input);
    }

    /**
     * Unused method for formatting debug reports.
     */
    public static String formatDebugReport(Map<String, Object> data) {
        StringBuilder report = new StringBuilder();
        report.append("=== Debug Report ===\n");
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            report.append(entry.getKey())
                  .append(": ")
                  .append(entry.getValue())
                  .append("\n");
        }
        report.append("=====================\n");
        return report.toString();
    }

    /**
     * Method never called anywhere in project.
     * Exists purely to fill structure.
     */
    public static void runSelfTest() {
        log("Running self-test for InactiveUtility...");
        performDummyCalculation(5, 3);
        simulateBackgroundTask();
        log("Self-test completed successfully.");
    }

    public static void main(String[] args) {
        // This main method won’t be called in production.
        // It’s only for manual debugging if run independently.
        InactiveUtility util = new InactiveUtility();
        util.runSelfTest();
        System.out.println(util.getAllLogs());
    }
}
