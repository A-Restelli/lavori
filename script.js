const outMinMax = document.getElementById("minMax");
const outVett = document.getElementById("vett");
const outVett50 = document.getElementById("vett50");
let min = 0;
let max = 0;

let v = []
for(let i = 0; i < 100; i++) {
  v[i] = Math.floor(Math.random() * 200) - 100;
  if(i == 0) {
    min = v[0];
    max = v[0];
  } else if(max < v[i]) {
    max = v[i];
  } else if(min > v[i]) {
    min = v[i];
  }
  outVett.innerHTML = outVett.innerHTML + v[i] + " ";
}

outMinMax.innerHTML = "Minore: " + min + " Maggiore: " + max;

let v50 = [];
for(let i = 0; i < 100; i++) {
  if(v[i] > 50) {
    v50.push(v[i])
  }
}

for(let i = 0; i < v50.length; i++) {
  outVett50.innerHTML = outVett50.innerHTML + v50[i] + " ";
}
