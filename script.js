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
  const td = document.getElementById('c' + i);
  td.innerHTML = v[i];
}

outMinMax.innerHTML = "Minore: " + min + " Maggiore: " + max;

let v50 = [];
let c = 0;
for(let i = 0; i < 100; i++) {
  if(v[i] > 50) {
    v50.push(v[i])
    const td = document.getElementById('v' + c);
    td.innerHTML = v50[c];
    c++;
  }
}


for(c; c < 100; c++) {
  const td = document.getElementById('v' + c);
  td.innerHTML = '-';
}
