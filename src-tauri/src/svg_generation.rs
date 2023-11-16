use quick_xml::{Writer, events::BytesText, Error};

static SVG_ATTRIBUTES: [(&'static str, &'static str); 4] = [
    ("xmlns:svg", "http://www.w3.org/2000/svg"),
    ("xmlns", "http://www.w3.org/2000/svg"),
    ("preserveAspectRatio", "xMidYMid meet"),
    ("class", "w-full max-h-full"),
];
// static PROCESSOR_PATH: &str =
//     r#"l75,0 l25,25 l0,75 l-100,0 l0,-100 m75,0 l0,-25 l50,0 l0,50 l-25,0"#;
static PROCESSOR_PATH: &str = "l75,0 l25,25 l0,75, l-100,0 l0,-100 Z";
static ROUTER_PATH: &str = "l0,-25 l50,0 l0,50 l-25,0 Z";
static ID_POSITION_PATH: &str = "l100,0 Z";

static PROCESSOR_ROUTER_ATTRIBUTES: [(&'static str, &'static str); 5] = [
    ("fill", "none"),
    ("fill-rule", "evenodd"),
    ("stroke", "black"),
    ("stroke-linecap", "butt"),
    ("stroke-width", "3"),
];
static GRAPH_ATTRIBUTES: [(&'static str, &'static str); 2] = [("id", "graph"), ("root", "true")];
static ID_POSITION_ATTRIBUTES: [(&'static str, &'static str); 5] = [
    ("fill", "none"),
    ("fill-rule", "evenodd"),
    ("stroke", "transparent"),
    ("stroke-linecap", "butt"),
    ("stroke-width", "0"),
];

const FONT_SIZE: i32 = 32;
const PROCESSOR_EDGE: i32 = 100;

fn add_processor_id(r: i32, c: i32, writer: &mut Writer<&mut Vec<u8>>, group_id: &String) -> () {
    // Invisible line for ID to sit on
    let position_id = format!("{}id_pos", group_id);
    let _ = writer
        .create_element("path")
        .with_attributes(ID_POSITION_ATTRIBUTES)
        .with_attribute(("id", position_id.as_str()))
        .with_attribute((
            "d",
            format!(
                "M{},{} {}",
                c * 150,
                r * 150 + PROCESSOR_EDGE / 2 + FONT_SIZE / 3,
                ID_POSITION_PATH
            )
            .as_str(),
        ))
        .write_empty();

    // ID
    let _ = writer
        .create_element("text")
        .with_attributes([
            ("font-size", format!("{}px", FONT_SIZE).as_str()),
            ("font-family", "Roboto Mono"),
            ("fill", "black"),
        ])
        .write_inner_content::<_, Error>(|text_writer| {
            let _ = text_writer
                .create_element("textPath")
                .with_attribute(("text-anchor", "middle"))
                .with_attribute(("startOffset", "25%"))
                .with_attribute(("href", format!("#{}", position_id).as_str()))
                .write_text_content(BytesText::new(group_id.as_str()));
            Ok(())
        });
}

fn add_router(r: &i32, c: &i32, writer: &mut Writer<&mut Vec<u8>>, group_id: &String) -> () {
    // Router
    let _ = writer
        .create_element("path")
        .with_attributes(PROCESSOR_ROUTER_ATTRIBUTES)
        .with_attribute(("id", format!("{}r", group_id).as_str()))
        .with_attribute((
            "d",
            format!(
                "M{},{} {}",
                c * 150 + 75, // 75 router offset
                r * 150,
                ROUTER_PATH
            )
            .as_str(),
        ))
        .write_empty();
}

fn add_core(r: &i32, c: &i32, writer: &mut Writer<&mut Vec<u8>>, group_id: &String) -> () {
    // Processor
    let _ = writer
        .create_element("path")
        .with_attributes(PROCESSOR_ROUTER_ATTRIBUTES)
        .with_attribute(("id", format!("{}p", group_id).as_str()))
        .with_attribute((
            "d",
            format!("M{},{} {}", *c * 150, *r * 150, PROCESSOR_PATH).as_str(),
        ))
        .write_empty();
}

pub fn generate(rows: i32, cols: i32) -> Vec<u8> {
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
                            let group_id = format!("{},{}", r + 1, c + 1);

                            let _ = graph_writer
                                .create_element("g")
                                .with_attribute(("id", group_id.as_str()))
                                .write_inner_content::<_, Error>(|writer| {
                                    add_core(&r, &c, writer, &group_id);
                                    add_router(&r, &c, writer, &group_id);
                                    add_processor_id(r, c, writer, &group_id);
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

    return buffer;
}
