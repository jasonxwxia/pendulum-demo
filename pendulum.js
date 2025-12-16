(() => {
	const canvas = document.getElementById("canvas");
	const ctx = canvas.getContext("2d");
	let W = canvas.width, H = canvas.height;
	const cx = W/2, cy = 160;


	//The current physics values of pendulums (states)
	let a1 = Math.PI/2, a2 = Math.PI/2; //angles of pendulum arms
	let a1_v = 0, a2_v = 0; //angular velocities of pendulum arms

	//parameters (linked to UI)
	const el = id => document.getElementById(id);
	const m1_s = el("m1"), m2_s = el("m2"), l1_s = el("l1"), l2_s = el("l2"), damp_s = el("damping"), grav_s = el("grav"), ang_s = el("angle");	 
	const m1Val = el("m1Val"), m2Val = el("m2Val"), l1Val = el("l1Val"), l2Val = el("l2Val"), dampVal = el("dampVal"), gravVal = el("gravVal"), angVal = el("angleVal");
	
	function readUI(){
		m1 = +m1_s.value; m2 = +m2_s.value; l1 = +l1_s.value; l2 = +l2_s.value; damping = +damp_s.value; grav = +grav_s.value*100; ang = +ang_s.value;
		m1Val.textContent = m1; m2Val.textContent = m2; l1Val.textContent = l1; l2Val.textContent = l2; dampVal.textContent = damping; gravVal.textContent = (+grav_s.value).toFixed(2); angVal.textContent = ang;
	}
	
	//The default parameters
	let m1 = +m1_s.value, m2 = +m2_s.value, l1 = +l1_s.value, l2 = +l2_s.value, damping = +damp_s.value, grav = +grav_s.value*100, ang = +ang_s.value, m_e = 0;
	readUI();
	[m1_s, m2_s, l1_s, l2_s, damp_s, grav_s, ang_s].forEach(s => s.addEventListener("input", readUI));
	let interval = 0;
	const data = [];

	function resize(){
		const ratio = window.devicePixelRatio || 1;
		W = canvas.clientWidth = Math.min(window.innerWidth - 40, 1100);
		H = canvas.clientHeight = Math.max(380, window.innerHeight - 220);
		canvas.width = Math.round(W * ratio);
		canvas.height = Math.round(H * ratio);
		canvas.style.width = W + "px";
		canvas.style.height = H + "px";
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
	}
	
	window.addEventListener("resize", resize);
	resize();


	//integration timestamp
	let last = performance.now();
	function derivatives(state){
		const [a1, a2, a1_v, a2_v] = state;
		const sin = Math.sin, cos = Math.cos;

		const numer1 = -grav * (2 * m1 + m2) * sin(a1) - m2 * grav * sin(a1 -2*a2) - 2 * sin(a1 - a2) * m2 * (a2_v**2 * l2 + a1_v**2 * l1 * cos(a1 - a2));
		const denom1 = l1*(2*m1 + m2 - m2 * cos(2*a1 - 2*a2));
		const a1_a = numer1/denom1; //a for acceleration

		const numer2 = 2*sin(a1 - a2) * (a1_v**2 * l1 * (m1+m2) + grav*(m1 + m2) * cos(a1) + a2_v**2 * l2 * m2 * cos(a1-a2));
		const denom2 = l2*(2*m1 + m2 - m2*cos(2*a1 - 2*a2));
		const a2_a = numer2/denom2;

		return [a1_v, a2_v, a1_a, a2_a];
	}
	function step(dt){
		dt = Math.min(dt, 0.02);

		const s0 = [a1, a2, a1_v, a2_v];
		
		const k1 = derivatives(s0);
		const s1 = s0.map((v,i) => v + k1[i]*dt/2);

		
		const k2 = derivatives(s1);
		const s2 = s0.map((v,i) => v + k2[i]*dt/2);

		
		const k3 = derivatives(s2);
		const s3 = s0.map((v,i) => v + k3[i]*dt);

		const k4 = derivatives(s3);

		a1 += dt/6 * (k1[0] + 2*k2[0] + 2*k3[0] + k4[0]);
		a2 += dt/6 * (k1[1] + 2*k2[1] + 2*k3[1] + k4[1]);
		a1_v += dt/6 * (k1[2] + 2*k2[2] + 2*k3[2] + k4[2]);
		a2_v += dt/6 * (k1[3] + 2*k2[3] + 2*k3[3] + k4[3]);
		
		a1_v *= damping;
		a2_v *= damping;

		//energy
		const kinetic1 = 0.5*(m1 + m2) * l1**2 * a1_v**2 + 0.5 * m2 * l2**2 * Math.cos(a2_v**2) + m2 * l1 * l2 * a1_v * a2_v * Math.cos(a1 - a2);
		const potential1 = -(m1 + m2) * grav * l1 * Math.cos(a1) - m2 * grav * l2 * Math.cos(a2);
		
		const v1x = l1 * a1_v * Math.cos(a1);
		const v1y = -l1 * a1_v * Math.sin(a1);
		const v2x = v1x + l2 * a2_v * Math.cos(a2);
		const v2y = v1y - l2 * a2_v * Math.sin(a2);
		
		const kinetic2 = 0.5 * m1 * (v1x*v1x + v1y*v1y) + 0.5 * m2 * (v2x*v2x + v2y*v2y);
		const yy1 = l1 * (1 - Math.cos(a1));
		const yy2 = yy1 + l2 * (1 - Math.cos(a2));
		const potential2 = m1 * grav * yy1 + m2 * grav * yy2;


		m_e = kinetic2 + potential2;
		interval +=1;
		let datapoint = [];
		if (interval % 1000 == 0){
			datapoint = [interval, m_e];
			data.push(datapoint);
		}		
		if (interval == 5000){
			console.log(data);
		}
	}

	//draw onto canvas
	function draw(){
		ctx.clearRect(0,0,W,H);
		ctx.save();

		ctx.fillStyle = "rgba(255,255,255,0.02)";
		ctx.fillRect(0,0,W,H);

		//coordinates
		const x1 = cx + l1 * Math.sin(a1);
		const y1 = cy + l1 * Math.cos(a1);
		const x2 = x1 + l2 * Math.sin(a2);
		const y2 = y1 + l2 * Math.cos(a2);


		//rods (lines)
		ctx.lineWidth = 4;
		ctx.lineCap = "round";
		ctx.strokeStyle = "rgba(96,165,250,0.9)";
		ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
		
		//bobs
		const r1 = Math.max(6, Math.sqrt(m1));
		const r2 = Math.max(6, Math.sqrt(m2));

		const grad1 = ctx.createRadialGradient(x1-3, y1-3, 2, x1, y1, r1+4);
		grad1.addColorStop(0, "#ffffff"); grad1.addColorStop(1, "#60a5fa");
		ctx.beginPath(); ctx.fillStyle = grad1; ctx.arc(x1, y1, r1, 0, Math.PI * 2); ctx.fill();

		const grad2 = ctx.createRadialGradient(x2-3, y2-3, 2, x2, y2, r2+4);
		grad2.addColorStop(0, "#ffffff"); grad2.addColorStop(1, "#60a5fa");
		ctx.beginPath(); ctx.fillStyle = grad2; ctx.arc(x2, y2, r2, 0, Math.PI * 2); ctx.fill();
	
		//energy telemetry
		ctx.fillStyle = "rgba(255,255,255,1";
		ctx.fillText("energy: " + m_e.toFixed(3), 12, H-35);

		ctx.restore();
	}

	//animation loop
	function loop(now){
		const dt = (now - last) / 1000;
		last = now;

		let acc = dt;
		const sub = 1/240;
		while(acc > 0){
			const s = Math.min(acc, sub);
			step(s);
			acc -= s;
		}
		draw();
		requestAnimationFrame(loop);
	}
	requestAnimationFrame(now => { last = now; loop(now); });

	//reset on dc
	canvas.addEventListener("dblclick", () => {
		a1 = ang*Math.PI/180; a2 = ang*Math.PI/180; a1_v = 0; a2_v = 0;
	});
	
	//change angle manually
	const input = document.getElementById("angle");
	input.addEventListener("input", () => {
		a1 = ang*Math.PI/180; a2 = ang*Math.PI/180; a1_v = 0; a2_v = 0;
	});

})();
