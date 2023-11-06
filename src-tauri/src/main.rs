// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use quick_xml::events::Event;
use quick_xml::Error;
use quick_xml::Reader;
use quick_xml::Writer;

static SVG_ATTRIBUTES: [(&'static str, &'static str); 3] = [
    ("preserveAspectRatio", "xMidYMid meet"),
    ("class", "w-full max-h-full"),
    ("style", "scale: 1;"),
];
static PROCESSOR_PATH: &str =
    r#"l75,0 l25,25 l0,75 l-100,0 l0,-100 m75,0 l0,-25 l50,0 l0,50 l-25,0"#;
static PROCESSOR_ATTRIBUTES: [(&'static str, &'static str); 5] = [
    ("fill", "none"),
    ("fill-rule", "evenodd"),
    ("stroke", "black"),
    ("stroke-linecap", "butt"),
    ("stroke-width", "3"),
];

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

    let mut buffer = Vec::new();
    let mut writer = Writer::new(&mut buffer);

    // Create svg
    writer
        .create_element("svg")
        .with_attributes(SVG_ATTRIBUTES)
        .with_attribute(("viewBox", format!("0 0 {} {}", width, height).as_str()))
        .write_inner_content::<_, Error>(|svgWriter| {
            for c in 0..cols {
                for r in 0..rows {
                    svgWriter
                        .create_element("g")
                        .with_attribute(("id", format!("{},{}", r + 1, c + 1).as_str()))
                        .write_inner_content::<_, Error>(|writer| {
                            writer
                                .create_element("path")
                                .with_attributes(PROCESSOR_ATTRIBUTES)
                                .with_attribute((
                                    "d",
                                    format!("M{},{} {}", c * 150, r * 150, PROCESSOR_PATH).as_str(),
                                ))
                                .write_empty()?;
                            Ok(())
                        });
                }
            }
            Ok(())
        });

    return std::str::from_utf8(&buffer).unwrap().to_string();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_svg, get_procesor_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
