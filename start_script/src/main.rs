use std::{env, fs, process::{Command, Output}, path::Path};
use regex::Regex;
use serde_json::Value;
use dotenv::dotenv;
use mysql::{self, Pool, OptsBuilder};
use url::Url;
use mysql::prelude::*;
use semver::Version;

// Function to check pnpm version against package.json
fn check_pnpm_version() -> Result<(), String> {
    let output = Command::new("pnpm").arg("--version").output().expect("Failed to execute command");
    if !output.status.success() {
        return Err("❌ Please install pnpm before proceeding".to_string());
    }

    let pnpm_version_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let pnpm_version = Version::parse(&pnpm_version_str).map_err(|_| "Failed to parse pnpm version")?;

    let package_json: Value = serde_json::from_str(&fs::read_to_string("package.json").expect("Failed to read package.json")).expect("Failed to parse package.json");
    let required_version_str = package_json["engines"]["pnpm"].as_str().expect("pnpm version not specified in package.json");

    // Extract the major version number from the required version string
    let required_major_version = required_version_str.trim_matches(|c: char| !c.is_digit(10))
                                                       .parse::<u64>()
                                                       .map_err(|_| "Invalid required version format in package.json")?;

    if pnpm_version.major >= required_major_version {
        Ok(())
    } else {
        Err(format!("❌ Please install pnpm version {} or newer before proceeding", required_version_str))
    }
}


// Function to check and copy .env file if needed
fn check_and_copy_env() -> Result<(), Box<dyn std::error::Error>> {
    if !Path::new(".env").exists() {
        fs::copy(".env.example", ".env")?;
        println!("🤝 .env.example copied to .env");
        println!("✅ env Check"); 
    } else {
        println!("✅ env Check"); 
    }
    Ok(())
}

// Function to check DATABASE_URL in .env
fn check_database_url() -> Result<(), &'static str> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").map_err(|_| "❌ - Please set DATABASE_URL in .env to be a proper mysql url")?;
    let is_mysql = database_url.starts_with("mysql://");

    if is_mysql {
        Ok(())
    } else {
        Err("❌ Please set DATABASE_URL in .env to be a proper mysql url")
    }
}

// Function to check if 'Show' table has data
fn check_show_table_data() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = env::var("DATABASE_URL").unwrap();
    let url = Url::parse(&database_url).expect("Invalid database URL");

    let username = url.username();
    let password = url.password().unwrap_or("");
    let host = url.host_str().expect("Database host is required");
    let port = url.port().unwrap_or(3306); // Default MySQL port
    let database = url.path().trim_start_matches('/');

    let opts = OptsBuilder::new()
        .user(Some(username))
        .pass(Some(password))
        .ip_or_hostname(Some(host))
        .tcp_port(port)
        .db_name(Some(database));

    let pool = Pool::new(opts)?;
    let mut conn = pool.get_conn()?;

    let count: i32 = conn.query_first("SELECT COUNT(*) FROM `Show`")?.unwrap_or(0);
    if count > 0 {
				println!("✅ Data Check");
        Ok(())
    } else {
        // Run 'pnpm db:init' command if no data
				println!("❌ Data Check");
				println!("🏃‍♀️ Running db:init....");
        Command::new("pnpm").args(["db:init"]).status()?;
				println!("✅ db:init completed");
        Err("Initialized database with 'pnpm db:init'".into())
    }
}

// Function to execute a command and print its output
fn execute_command(command: &str, args: &[&str]) {
    match Command::new(command).args(args).spawn() {
        Ok(mut child) => {
            child.wait().expect("Failed to run command");
        },
        Err(e) => eprintln!("Failed to run command '{}': {}", command, e),
    }
}

// Main function
fn main() {
    if let Err(e) = check_pnpm_version() {
        eprintln!("{}", e);
        return;
    } else {
        println!("✅ pnpm Check");
    }

    if let Err(e) = check_and_copy_env() {
        eprintln!("Error checking/copying .env file: {}", e);
        return;
    }

    match check_database_url() {
        Ok(_) => println!("✅ DATABASE_URL Check"),
        Err(e) => {
            eprintln!("{}", e);
            return;
        }
    }

    if let Err(e) = check_show_table_data() {
        eprintln!("{}", e);
    }

    // Run 'pnpm vite dev' command
    execute_command("pnpm", &["vite", "dev"]);
}

