// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::f32::consts::E;
use std::io::Cursor;
use std::sync::Mutex;

use quick_xml::events::BytesText;
use quick_xml::events::Event;
use quick_xml::Error;
use quick_xml::Reader;
use quick_xml::Writer;
use tauri::State;

static SVG_ATTRIBUTES: [(&'static str, &'static str); 4] = [
    ("xmlns:svg", "http://www.w3.org/2000/svg"),
    ("xmlns", "http://www.w3.org/2000/svg"),
    ("preserveAspectRatio", "xMidYMid meet"),
    ("class", "w-full max-h-full"),
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
static GRAPH_ATTRIBUTES: [(&'static str, &'static str); 2] = [("id", "graph"), ("root", "true")];

struct SVGString(Mutex<String>);

#[tauri::command]
fn get_procesor_info(r: i32, c: i32) -> String {
    return format!("You are hovering on processor {},{}", r + 1, c + 1);
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_svg(plain_svg: State<SVGString>) -> String {
    let rows = 10;
    let cols = 10;
    let width = rows * 150;
    let height = cols * 150;

    let mut buffer = Vec::new();
    let mut writer = Writer::new(&mut buffer);

    // Create svg
    let _ = writer
        .create_element("svg")
        .with_attributes(SVG_ATTRIBUTES)
        .with_attribute(("viewBox", format!("0 0 {} {}", width, height).as_str()))
        .write_inner_content::<_, Error>(|svg_writer| {
            // Graph
            let _ = svg_writer
                .create_element("g")
                .with_attributes(GRAPH_ATTRIBUTES)
                .write_inner_content::<_, Error>(|graph_writer| {
                    for c in 0..cols {
                        for r in 0..rows {
                            let _ = graph_writer
                                .create_element("g")
                                .with_attribute(("id", format!("{},{}", r + 1, c + 1).as_str()))
                                .write_inner_content::<_, Error>(|writer| {
                                    // Processor
                                    writer
                                        .create_element("path")
                                        .with_attributes(PROCESSOR_ATTRIBUTES)
                                        .with_attribute((
                                            "d",
                                            format!("M{},{} {}", c * 150, r * 150, PROCESSOR_PATH)
                                                .as_str(),
                                        ))
                                        .write_empty()?;
                                    // ID
                                    writer
                                        .create_element("text")
                                        .with_attributes([
                                            ("font-size", "25px"),
                                            ("x", format!("{}", c * 150 + 25).as_str()),
                                            ("y", format!("{}", r * 150 + 25).as_str()),
                                        ])
                                        .write_text_content(BytesText::new(
                                            format!("{},{}", c + 1, r + 1).as_str(),
                                        ))?;
                                    Ok(())
                                });
                        }
                    }
                    Ok(())
                });

            // Rectangle for export aid
            let _ = svg_writer
                .create_element("rect")
                .with_attributes([
                    ("width", "100%"),
                    ("height", "100%"),
                    ("fill", "none"),
                    ("stroke", "#ff0000"),
                    ("stroke-width", "3px"),
                ])
                .write_empty();

            Ok(())
        });

    let mut svg_content = plain_svg.0.lock().unwrap();
    *svg_content = std::str::from_utf8(&buffer).unwrap().to_string();
    return svg_content.to_string();
}

#[tauri::command]
fn render_svg(x: f32, y: f32, k: f32, width: f32, height: f32, plain_svg: State<SVGString>) {
    // The x and y come from a CSS translation so we need to invert the sign.
    // Suppose user moves element to the left by 100px.
    // Translation is going to be x: -100, y: 0.
    // On our end here, we want to move the viewBox 100 to the right to obtain
    // same effect. Hence x = - (-100 / k)
    let x_scaled_down = -x / k;
    let y_scaled_down = -y / k;
    print!("x: {} y: {}\n", x_scaled_down, y_scaled_down);

    let svg_content = plain_svg.0.lock().unwrap();
    let b = svg_content.to_string();
    let mut reader = Reader::from_str(&b);
    reader.trim_text(true);

    let mut buffer = Vec::new();
    let mut writer = Writer::new(&mut buffer);

    loop {
        match reader.read_event() {
            Ok(Event::Start(e)) if e.name().as_ref() == b"svg" => {
                let mut elem = e.to_owned();
                elem.clear_attributes();
                elem = elem.with_attributes(
                    e.attributes()
                        .map(|attr| attr.unwrap())
                        .filter(|attr| attr.key.as_ref() != b"viewBox"),
                );

                elem.push_attribute((
                    "viewBox",
                    format!(
                        "{} {} {} {}",
                        x_scaled_down,
                        y_scaled_down,
                        1500.0 / k,
                        1500.0 / k
                    )
                    .as_str(),
                ));
                assert!(writer.write_event(Event::Start(elem)).is_ok());
            }
            Err(e) => panic!("Error at position {}: {:?}", reader.buffer_position(), e),
            // exits the loop when reaching end of file
            Ok(Event::Eof) => break,
            Ok(e) => assert!(writer.write_event(e).is_ok()),
        }
    }

    print!("{}", std::str::from_utf8(&buffer).unwrap().to_string());
}

fn main() {
    tauri::Builder::default()
        .manage(SVGString(Default::default()))
        .invoke_handler(tauri::generate_handler![
            get_svg,
            render_svg,
            get_procesor_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
