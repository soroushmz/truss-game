function f1(){
    console.log("f1");
}

export default function f2() {
    f1();
    console.log('f2');
  }

export { f1 }
// export { f2 }