function hsvToRgb(h, s, v) {
	let r, g, b;
	let i = Math.floor(h * 6);
	let f = h * 6 - i;
	let p = v * (1 - s);
	let q = v * (1 - f * s);
	let t = v * (1 - (1 - f) * s);

	switch (i % 6) {
		case 0: [r, g, b] = [v, t, p]; break;
		case 1: [r, g, b] = [q, v, p]; break;
		case 2: [r, g, b] = [p, v, t]; break;
		case 3: [r, g, b] = [p, q, v]; break;
		case 4: [r, g, b] = [t, p, v]; break;
		case 5: [r, g, b] = [v, p, q]; break;
	}

	return [
		Math.round(r * 255),
		Math.round(g * 255),
		Math.round(b * 255)
	];
}

function generateRandomFullSaturationBrightnessColor() {
	let h = Math.random();
	let s = 1;
	let v = 1;

	return hsvToRgb(h, s, v);
}

function componentToHex(c) {
	let hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
	if (hex.charAt(0) === '#') {
		hex = hex.substr(1);
	}

	if (hex.length !== 3 && hex.length !== 6) {
		throw new Error('Invalid hexadecimal color provided.');
	}

	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}

	const rgb = [];
	for (let i = 0; i <= 2; i++) {
		rgb[i] = parseInt(hex.substr(i * 2, 2), 16);
	}

	return rgb;
}

function getDateString() {
	let date_ob = new Date();

	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let hours = ("0" + date_ob.getHours()).slice(-2);
	let minutes = ("0" + date_ob.getMinutes()).slice(-2);
	let seconds = ("0" + date_ob.getSeconds()).slice(-2);

	return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
}

var socket;

const terminal = new Terminal();
const fitAddon = new FitAddon.FitAddon();
const webGLAddon = new WebglAddon.WebglAddon();
const webLinkAddon = new WebLinksAddon.WebLinksAddon();

webGLAddon.onContextLoss(e => {
	console.log("WebglAddon onContextLoss");
	webGLAddon.dispose();
});

terminal.loadAddon(webGLAddon);
terminal.loadAddon(fitAddon);
terminal.loadAddon(webLinkAddon);

$(() => {
	let rgb = generateRandomFullSaturationBrightnessColor();
	let hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
	$("#color_picker").val(hex);

	Coloris({
		themeMode: 'dark',
		alpha: false,
		el: "#color_picker",
		defaultColor: hex,
	});

	terminal.open(document.getElementById("terminal"));

	window.addEventListener("resize", (event) => {
		fitAddon.fit();
	});

	fitAddon.fit();

	socket = io();
	socket.on("color", function (data) {
		console.log(data);
		terminal.writeln("[" + getDateString() + "] Someone requested R: " + data.r + " G: " + data.g + " B: " + data.b);
	});

	socket.on("disconnect", () => {
		terminal.writeln("Disconnected");
	});

	$("#btn_random").on("click", () => {
		let rgb = generateRandomFullSaturationBrightnessColor();
		let hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
		$("#color_picker").val(hex);
		$("#color_picker")[0].dispatchEvent(new Event('input', { bubbles: true }));
	});

	$("#btn_send").on("click", () => {
		const hex = $("#color_picker").val();
		const rgb = hexToRgb(hex);
		console.log("Input is: " + hex);
		console.log(rgb);

		$.ajax({
			type: "POST",
			url: "/api/set_color",
			data: JSON.stringify({ r: rgb[0], g: rgb[1], b: rgb[2] }),
			contentType: "application/json; charset=utf-8",
			dataType: "text",
			success: function (data, textStatus, jqXHR) {
				console.log("Success");
				toastr.success("Color sent");
			},
			error: function (jqXHR, textStatus, errorThrown) {
				if (jqXHR.status === 429) {
					console.log("Rate limited");
					toastr.warning("Please wait a few seconds before trying to change the color again");
				} else if (jqXHR.status !== 200) {
					console.log("Server did a fucky wucky");
					toastr.error("Could not send color");
				}
			}
		});
	});

	let hue = 0;
	const header = document.getElementById('header');

	function changeColor() {
		hue = (hue + 1) % 360;
		header.style.color = `hsl(${hue}, 100%, 50%)`;
	}

	setInterval(changeColor, 10);

	$("#domain").text(window.location.protocol + '//' + window.location.hostname);
});