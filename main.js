function insert_attributes(base64_image, new_attributes) {
    header_end = base64_image.search("base64,")+"base64,".length
    image_header = base64_image.substring(0, header_end)
    image_old = atob(base64_image.substring(header_end))
    // Find the xml
    xml_start = image_old.search("<x:xmpmeta")
    xml_end = image_old.search("</x:xmpmeta>")+"</x:xmpmeta>".length
    xml = image_old.substring(xml_start, xml_end)
    // Parse the xml
    parser = new DOMParser()
    xml_doc = parser.parseFromString(xml,"text/xml")
    xml_result = '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n'
    xml_result += ' <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n'
    // Find the attributes
    rdf = xml_doc.children[0].children[0].children[0]
    _attributes = [ ...rdf.attributes ]
    attributes = {}
    for (let att of _attributes) {
        attributes[att.name] = att.value
    }
    attributes = Object.assign({}, attributes, new_attributes)
    // Create xml_result
    attributes_names = Object.keys(attributes)
    about = attributes["rdf:about"]
    xmlns = attributes_names.filter(a=>a.startsWith("xmlns:"))
    for (let x of xmlns) {
        let val = x.substring("xmlns:".length)
        xml_result += `  <rdf:Description rdf:about="${about}" ${x}="${attributes[x]}">\n`
        for (let att of attributes_names.filter(a=>a.startsWith(val+":"))) {
            xml_result += `   <${att}>${attributes[att]}</${att}>\n`
        }
        xml_result += `  </rdf:Description>\n`                
    }
    xml_result += ' </rdf:RDF>\n'
    xml_result += '</x:xmpmeta>'
    // Insert XML
    new_image = image_header + btoa(
        image_old.substring(0, xml_start) + 
        xml_result +
        image_old.substring(xml_end)
    )
    return new_image
}

function view_pano_photo() {
    pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": new_image.src,
        "autoLoad": true,
        "autoRotate": -2
    })
}

function handleFileSelect(evt) {
    var file = evt.target.files[0]

    var reader = new FileReader()
    reader.onload = function(e) {
        // Get the image
        var image_name = e.target.fileName
        var image = e.target.result
        attributes = {
            "xmlns:GPano": "http://ns.google.com/photos/1.0/panorama/",
            "GPano:ProjectionType": "equirectangular"
        }
        image = insert_attributes(image, attributes)
        var new_image = new Image()
        new_image.src = image
        new_image.width = 200
        
        view_pano_photo()

        // download("hello.jpg", new_image.src)
    };
    reader.readAsDataURL(file)
}



function download(filename, data) {
    var element = document.createElement('a')
    element.setAttribute('href', data)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}
