// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use svg::node::element::path::Data;
use svg::node::element::Group;
use svg::node::element::Path;
use svg::Document;

fn draw_processor(r: i32, c: i32) -> Group {
    let data = Data::new()
        .move_to((150 * r, 150 * c))
        .line_by((75, 0))
        .line_by((25, 25))
        .line_by((0, 75))
        .line_by((-100, 0))
        .line_by((0, -100))
        .move_by((75, 0))
        .line_by((0, -25))
        .line_by((50, 0))
        .line_by((0, 50))
        .line_by((-25, 0));

    let path = Path::new()
        .set("fill", "none")
        .set("stroke", "black")
        .set("stroke-width", 3)
        .set("fill-rule", "evenodd")
        .set("stroke-linecap", "butt")
        .set("d", data);

    return Group::new()
        .set("id", format!("{},{}", r + 1, c + 1))
        .add(path);
}

#[tauri::command]
fn get_procesor_info(r: i32, c: i32) -> String {
    return format!("You are hovering on processor {},{}", r + 1, c + 1);
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_svg() -> String {
    let rows = 10;
    let cols = 10;
    let width = rows * 150;
    let height = cols * 150;

    // Create document
    let mut document = Document::new()
        .set("viewBox", (0, 0, width, height))
        .set("preserveAspectRatio", "xMidYMid meet");

    for c in 0..cols {
        for r in 0..rows {
            document = document.add(draw_processor(r, c));
        }
    }

    return document.to_string();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_svg, get_procesor_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
