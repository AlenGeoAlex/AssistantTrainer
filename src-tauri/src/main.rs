// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod schema;

use std::fs;
use std::path::Path;
use crate::schema::export_options::ExportOptions;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![export])
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn export(body: ExportOptions) -> Result<String, String> {
     let path = Path::new(&body.export_path);

    match path.try_exists() {
        Ok(true) => {
            if !path.is_dir() {
                return Err("file-system-error: not a directory".into());
            }
        }
        Ok(false) => return Err("file-system-error: path does not exist".into()),
        Err(_) => return Err("file-system-error: unable to access path".into()),
    }

    let file_path = path.join(&body.file_name);
    println!("Export Path: {}", file_path.to_string_lossy().to_string());

    if let Err(err) = fs::write(&file_path, &body.json_data) {
        return Err(format!("file-write-error 2: {}", err));
    }

    Ok(file_path.to_string_lossy().to_string())
}