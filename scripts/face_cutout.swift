// Cut a head out of a headshot for the About page: transparent background, cut off below
// the chin. macOS 14+ only (Vision subject lifting + face landmarks); no packages needed.
//
//   swift scripts/face_cutout.swift <input image> <output.png>
//
// Then trim the empty margin and compress:
//   magick <output.png> -trim +repage -quality 85 src/assets/team/<name>.webp
import AppKit
import CoreImage
import Vision

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
	FileHandle.standardError.write("usage: face_cutout.swift <input> <output.png>\n".data(using: .utf8)!)
	exit(64)
}

let input_url = URL(fileURLWithPath: arguments[1])
let output_url = URL(fileURLWithPath: arguments[2])

guard let source = CIImage(contentsOf: input_url, options: [.applyOrientationProperty: true]) else {
	fatalError("Could not read \(input_url.path)")
}
let context = CIContext()
guard let cg_source = context.createCGImage(source, from: source.extent) else {
	fatalError("Could not decode \(input_url.path)")
}
let width = CGFloat(cg_source.width)
let height = CGFloat(cg_source.height)

let handler = VNImageRequestHandler(cgImage: cg_source)
let subject_request = VNGenerateForegroundInstanceMaskRequest()
let face_request = VNDetectFaceLandmarksRequest()
try handler.perform([subject_request, face_request])

guard let face = face_request.results?.max(by: { $0.boundingBox.width < $1.boundingBox.width }) else {
	fatalError("No face found in \(input_url.path)")
}
guard let subject = subject_request.results?.first else {
	fatalError("No subject found in \(input_url.path)")
}

// Vision coordinates are normalised with the origin at the bottom left, same as Core Image.
let box = VNImageRectForNormalizedRect(face.boundingBox, Int(width), Int(height))
guard let contour = face.landmarks?.faceContour?.pointsInImage(imageSize: CGSize(width: width, height: height)),
	contour.count > 2
else {
	fatalError("No jawline found in \(input_url.path)")
}

// Head region: generous room above for hair and each side for ears and hats. The subject
// mask decides the real edge; trim the empty margin afterwards.
let crop = CGRect(
	x: box.minX - box.width * 0.6,
	y: box.minY - box.height * 0.1,
	width: box.width * 2.2,
	height: box.height * 2.2
).intersection(CGRect(x: 0, y: 0, width: width, height: height))

// Keep everything above the lower jaw: the jaw points, pushed a touch outward so the chin
// isn't clipped. Past the cheeks the cut runs out from the lower jaw and slopes up, which keeps
// the ears and hair beside the face but drops the neck and shoulders.
let centre = CGPoint(x: box.midX, y: box.midY)
let jaw_points = contour.map { point -> CGPoint in
	let dx = point.x - centre.x
	let dy = point.y - centre.y
	return CGPoint(x: centre.x + dx * 1.06, y: centre.y + dy * 1.06)
}
// Walk the jaw left to right so the outline never crosses the face.
let jaw = jaw_points.first!.x > jaw_points.last!.x ? Array(jaw_points.reversed()) : jaw_points
let head_path = CGMutablePath()
let lower_jaw = Array(jaw[(jaw.count / 4)...(jaw.count * 3 / 4)])
head_path.move(to: CGPoint(x: crop.minX - 1, y: crop.maxY + 1))
let left = lower_jaw.first!
let right = lower_jaw.last!
head_path.addLine(to: CGPoint(x: crop.minX - 1, y: left.y + (left.x - crop.minX) * 0.45))
for point in lower_jaw { head_path.addLine(to: point) }
head_path.addLine(to: CGPoint(x: crop.maxX + 1, y: right.y + (crop.maxX - right.x) * 0.45))
head_path.addLine(to: CGPoint(x: crop.maxX + 1, y: crop.maxY + 1))
head_path.closeSubpath()

// Rasterise the head shape as a mask the size of the source image.
let gray = CGColorSpaceCreateDeviceGray()
guard let head_context = CGContext(
	data: nil, width: Int(width), height: Int(height), bitsPerComponent: 8, bytesPerRow: 0,
	space: gray, bitmapInfo: CGImageAlphaInfo.none.rawValue
) else { fatalError("Could not make the head mask") }
head_context.setFillColor(gray: 0, alpha: 1)
head_context.fill(CGRect(x: 0, y: 0, width: width, height: height))
head_context.setFillColor(gray: 1, alpha: 1)
head_context.addPath(head_path)
head_context.fillPath()
let head_mask = CIImage(cgImage: head_context.makeImage()!)

// The subject mask from Vision, scaled to the source size.
let subject_buffer = try subject.generateScaledMaskForImage(
	forInstances: subject.allInstances, from: handler
)
let subject_mask = CIImage(cvPixelBuffer: subject_buffer)

// Final alpha = subject AND head shape.
let alpha = head_mask.applyingFilter("CIMultiplyCompositing", parameters: [
	kCIInputBackgroundImageKey: subject_mask
])
let cutout = source.applyingFilter("CIBlendWithMask", parameters: [
	kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: source.extent),
	kCIInputMaskImageKey: alpha
]).cropped(to: crop)

guard let cg_cutout = context.createCGImage(cutout, from: cutout.extent) else {
	fatalError("Could not render the cutout")
}
let bitmap = NSBitmapImageRep(cgImage: cg_cutout)
guard let png = bitmap.representation(using: .png, properties: [:]) else {
	fatalError("Could not encode PNG")
}
try png.write(to: output_url)
print("\(output_url.path) \(cg_cutout.width)x\(cg_cutout.height)")
