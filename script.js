const outMinMax = getElementById("minMax");
const outVett = getElementById("Vett");
const outVett50 = getElementById("Vett50");
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
}

let v50 = [];
for(let i = 0; i < 100; i++) {
  if(v[i] > 50) {
    v50.push(v[i])
  }
}
