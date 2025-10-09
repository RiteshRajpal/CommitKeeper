
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;
class User {
    private String name;
    private int age;
    private String email;

    public User(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
    public String getEmail() { return email; }

    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + ", email='" + email + "'}";
    }
}
class UserManager {
    private List<User> users = new ArrayList<>();

    public void addUser(User user) {
        users.add(user);
        System.out.println("✅ User added successfully!");
    }

    public void listUsers() {
        if (users.isEmpty()) {
            System.out.println("⚠️ No users found.");
            return;
        }
        System.out.println("\n📋 List of users:");
        for (User u : users) {
            System.out.println(u);
        }
    }

    public void searchUser(String name) {
        boolean found = false;
        for (User u : users) {
            if (u.getName().equalsIgnoreCase(name)) {
                System.out.println("🔍 Found: " + u);
                found = true;
            }
        }
        if (!found) {
            System.out.println("❌ No user found with name: " + name);
        }
    }
}
public class SampleApp {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        UserManager userManager = new UserManager();
        int choice;

        System.out.println("===================================");
        System.out.println("     🧩 Sample Java Application");
        System.out.println("===================================");

        do {
            System.out.println("\nMenu:");
            System.out.println("1. Add User");
            System.out.println("2. View All Users");
            System.out.println("3. Search User");
            System.out.println("4. Exit");
            System.out.print("Enter your choice: ");
            while (!scanner.hasNextInt()) {
                System.out.println("Please enter a valid number!");
                scanner.next();
            }
            choice = scanner.nextInt();
            scanner.nextLine(); // consume newline

            switch (choice) {
                case 1:
                    System.out.print("Enter name: ");
                    String name = scanner.nextLine();
                    System.out.print("Enter age: ");
                    int age = scanner.nextInt();
                    scanner.nextLine();
                    System.out.print("Enter email: ");
                    String email = scanner.nextLine();
                    userManager.addUser(new User(name, age, email));
                    break;
                case 2:
                    userManager.listUsers();
                    break;
                case 3:
                    System.out.print("Enter name to search: ");
                    String search = scanner.nextLine();
                    userManager.searchUser(search);
                    break;
                case 4:
                    System.out.println("👋 Exiting program. Goodbye!");
                    break;
                default:
                    System.out.println("Invalid choice, please try again!");
            }

        } while (choice != 4);

        scanner.close();
    }
}
