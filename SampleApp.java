
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class SupabaseJDBCExample {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://db.<your-supabase-host>.supabase.co:5432/postgres";
        String user = "postgres"; // 
        String password = "<dreamblade1>";
        try {
           
            Class.forName("org.postgresql.Driver");

            // Establish connection
            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM users LIMIT 5;");
            System.out.println("\n📋 Data from 'users' table:");
            while (rs.next()) {
                System.out.println("- " + rs.getString("name") + " | " + rs.getString("email"));
            }
            rs.close();
            stmt.close();
            conn.close();
            System.out.println("\n.");
        } catch (Exception e) {
            System.out.println("  " + e.getMessage());
            e.printStackTrace();
        }
    }
}

