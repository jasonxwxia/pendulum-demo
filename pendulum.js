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
	const m1_s = el("m1"), m2_s = el("m2"), l1_s = el("l1"), l2_s = el("l2"), damp_s = el("damping"), grav_s = el("grav");	 
	const m1Val = el("m1Val"), m2Val = el("m2Val"), l1Val = el("l1Val"), l2Val = el("l2Val"), dampVal = el("dampVal"), gravVal = el("gVal");
	
	function readUI(){
		m1 = +m1_s.value; m2 = +m2_s.value; l1 = +l1_s.value; l2 = +l2_s.value; damping = +damp_s.value; grav = +grav_s.value;

