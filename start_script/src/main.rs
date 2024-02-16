use std::{env, fs::{self, File, OpenOptions}, process::{Command}, path::Path, collections::{HashSet, HashMap}};
use std::io::{ BufRead, Write, BufReader, self};
use std::str;
use serde_json::Value;
use dotenv::dotenv;
use mysql::{self, Pool, OptsBuilder};
use url::Url;
use mysql::prelude::*;
use semver::Version;

// This Rust script performs the following steps:
// 1. Checks if the installed pnpm version meets the requirement specified in package.json.
// 2. Ensures the .env file is updated with any missing variables found in .env.example.
// 3. Validates that the DATABASE_URL in .env is a proper MySQL URL.
// 4. Checks if the 'Show' table in the database has data.
//    - If not, seeds the database with data from a .sql file.
// 5. Runs a custom pnpm command if there's a change in the database schema.

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

    let required_major_version = required_version_str.trim_matches(|c: char| !c.is_digit(10))
                                                       .parse::<u64>()
                                                       .map_err(|_| "Invalid required version format in package.json")?;

    if pnpm_version.major >= required_major_version {
        Ok(())
    } else {
        Err(format!("❌ Please install pnpm version {} or newer before proceeding", required_version_str))
    }
}

// Function to check and update .env file with missing variables from .env.example
fn check_and_update_env() -> Result<(), Box<dyn std::error::Error>> {
    let env_path = Path::new(".env");
    let env_example_path = Path::new(".env.example");

    if !env_path.exists() {
        fs::copy(env_example_path, env_path)?;
        println!("🤝 .env.example copied to .env");
				let mysql_query = prompt_for_mysql_query();
				let env_contents = fs::read_to_string(env_path)?;
				let new_env_contents = env_contents.replace("DATABASE_URL='REQUIRED__YOU_NEED_A_MYSQL_URL'", &format!("DATABASE_URL='{}'", mysql_query));
				fs::write(env_path, new_env_contents)?;

				println!("✅ Updated DATABASE_URL in .env");
    } else {
        let existing_vars = read_env_vars_and_values(env_path)?;
        let example_vars = read_env_vars_and_values(env_example_path)?;

        let missing_vars: HashSet<_> = example_vars.keys()
                                                    .filter(|key| !existing_vars.contains_key(*key))
                                                    .cloned()
                                                    .collect();

        if !missing_vars.is_empty() {
            append_missing_vars_to_env(env_path, &missing_vars, &example_vars)?;
        }
    }

    println!("✅ .env");
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

fn get_db_ops() -> OptsBuilder {
    let database_url = env::var("DATABASE_URL").unwrap();
    let url = Url::parse(&database_url).expect("Invalid database URL");

    let username = url.username();
    let password = url.password().unwrap_or("");
    let host = url.host_str().expect("Database host is required");
    let port = url.port().unwrap_or(3306);
    let database = url.path().trim_start_matches('/');

    OptsBuilder::new()
        .user(Some(username))
        .pass(Some(password))
        .ip_or_hostname(Some(host))
        .tcp_port(port)
        .db_name(Some(database))
}



fn get_db_command_prefix() -> String {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").unwrap();
    let url = Url::parse(&database_url).expect("Invalid database URL");

    let username = url.username();
    let password = url.password().unwrap_or("");
    let host = url.host_str().expect("Database host is required");
    let port = url.port().unwrap_or(3306);
    let database = url.path().trim_start_matches('/');

    let is_docker = match env::var("DOCKER") {
        Ok(value) => value.to_lowercase() == "true",
        Err(_) => false,
    };

    let mysql_command = if is_docker {
        "docker exec -i $(docker-compose ps -q db) mysql"
    } else {
        "mysql"
    };

    let command = format!(
        "{mysql_command} -h {host} -P {port} -u {username} -p{password} {database}",
    );
	
    return command
}

fn parse_count_from_output(output: &str) -> Result<i32, Box<dyn std::error::Error>> {
    let lines: Vec<&str> = output.split('\n').collect();
    if let Some(&count_line) = lines.get(1) {  // Typically, the count is on the second line of the output
        let count: i32 = count_line.trim().parse()?;
        Ok(count)
    } else {
        Err("Failed to parse the count from the output".into())
    }
}


// Function to check if 'Show' table has data
// Modified function to check if 'Show' table has data using the mysql command
fn check_show_table_data() -> Result<(), Box<dyn std::error::Error>> {
    let mysql_command_prefix = get_db_command_prefix();
    let check_data_command = format!("{} -e 'SELECT COUNT(*) FROM `Show`'", mysql_command_prefix);
    let output = Command::new("sh")
		.arg("-c")
		.arg(&check_data_command)
		.output()?;
	
    if !output.status.success() {
        let stderr = str::from_utf8(&output.stderr)?;
        return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, stderr)));
    }

		let output_str = str::from_utf8(&output.stdout)?;
		let count = parse_count_from_output(output_str)?;


    if count > 0 {
        println!("✅ Data Check");
        Ok(())
    } else {
        println!("❌ Data Check - Seeding database...");
        seed_database()?;
        println!("✅ Database seeded");
        Command::new("pnpm").args(["i-changed-the-schema"]).status()?;
        println!("✅ Schema change command executed");
        Ok(())
    }
}

// Add a function to prompt the user for the MySQL query string
fn prompt_for_mysql_query() -> String {
    println!("Please enter the MySQL query string:");
    let mut query = String::new();
    io::stdin().read_line(&mut query).expect("Failed to read line");
    query.trim().to_string()
}



// Function to seed the database with an SQL file
fn seed_database() -> Result<(), Box<dyn std::error::Error>> {
    let is_docker = match env::var("DOCKER") {
        Ok(value) => value.to_lowercase() == "true",
        Err(_) => false,
    };

    // Check if not using docker and mysql command is available
    if !is_docker && Command::new("mysql").arg("--version").output().is_err()  {
        return Err("❌ MySQL is not installed. Please install MySQL first.".into());
    }

    let seed_file_path = "./seed/seed.sql";
    let mysql_command = format!(
        "{} < {}",
        get_db_command_prefix(), seed_file_path
    );

    let status = Command::new("sh")
        .arg("-c")
        .arg(&mysql_command)
        .status()
        .expect("Failed to execute MySQL command");

    if !status.success() {
        return Err("Failed to seed the database using MySQL command".into());
    }

    println!("✅ Database seeded with SQL file");
    Ok(())
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

// Function to read environment variables and their values from a file into a HashMap
fn read_env_vars_and_values(path: &Path) -> Result<HashMap<String, String>, io::Error> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    let vars = reader.lines()
        .filter_map(Result::ok)
        .filter(|line| !line.trim().is_empty() && !line.starts_with('#'))
        .map(|line| {
            let mut parts = line.splitn(2, '=');
            let key = parts.next().unwrap_or("").to_string();
            let value = parts.next().unwrap_or("").to_string();
            (key, value)
        })
        .collect();

    Ok(vars)
}

// Function to append missing variables and their values to the .env file
fn append_missing_vars_to_env(path: &Path, missing_vars: &HashSet<String>, example_vars: &HashMap<String, String>) -> Result<(), io::Error> {
    let mut file = OpenOptions::new().write(true).append(true).open(path)?;

    for var in missing_vars {
        if let Some(value) = example_vars.get(var) {
            writeln!(file, "{}={}", var, value)?;
        }
    }

    Ok(())
}

// Main function
fn main() {

    // Parse command line arguments
    let args: Vec<String> = env::args().collect();

    // Check if '--env-only' flag is provided
    if args.contains(&"--env-only".to_string()) {
        if let Err(e) = check_and_update_env() {
            eprintln!("Error checking/copying .env file: {}", e);
        } else {
					execute_command("pnpm", &["install"]); 
					println!("🥘 Website preheated to 450°F (232°C)");
        }
        return;
    }


    if let Err(e) = check_pnpm_version() {
        eprintln!("{}", e);
        return;
    } else {
        println!("✅ pnpm Check");
    }

    if let Err(e) = check_and_update_env() {
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

        if let Err(err) = seed_database() {
            eprintln!("Failed to seed database from sql file: {}", err);
        } else {
            println!("Database seeded successfully from sql file.");
        }
    }

    // Run 'pnpm vite dev' command
    execute_command("pnpm", &["vite", "dev"]); 
}