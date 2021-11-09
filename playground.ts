function* foo(index) {
    while (index < 2) {
        yield index;
        index++;
    }
}

const bruh = foo(0);

let next = bruh.next().value;

while (true) {
    console.log(next);
    next = bruh.next().value;
}