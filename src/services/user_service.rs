use std::collections::HashMap;
use crate::models::User;

pub struct UserService {
    users: HashMap<String, User>,
}

impl UserService {
    pub fn new() -> Self {
        let mut users = HashMap::new();
        
        // Inicializar usuários padrão
        users.insert("admin".to_string(), User::new(
            "admin".to_string(),
            "admin123".to_string(),
            "admin".to_string(),
        ));
        users.insert("user".to_string(), User::new(
            "user".to_string(),
            "user123".to_string(),
            "user".to_string(),
        ));
        users.insert("alice".to_string(), User::new(
            "alice".to_string(),
            "alice123".to_string(),
            "user".to_string(),
        ));
        users.insert("bob".to_string(), User::new(
            "bob".to_string(),
            "bob123".to_string(),
            "user".to_string(),
        ));
        users.insert("charlie".to_string(), User::new(
            "charlie".to_string(),
            "charlie123".to_string(),
            "user".to_string(),
        ));
        users.insert("diana".to_string(), User::new(
            "diana".to_string(),
            "diana123".to_string(),
            "user".to_string(),
        ));

        Self { users }
    }

    pub fn authenticate(&self, username: &str, password: &str) -> Option<&User> {
        self.users.get(username)
            .filter(|user| user.password == password)
    }

    pub fn get_all_usernames(&self) -> Vec<String> {
        self.users.keys().cloned().collect()
    }

    pub fn get_user(&self, username: &str) -> Option<&User> {
        self.users.get(username)
    }
}
