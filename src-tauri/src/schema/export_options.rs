use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ExportOptions {
    pub export_path: String,
    pub json_data: String,
    pub file_name: String
}