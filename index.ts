import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let waiting_strs: string[] = [];
let waiting_cb: ((res: string) => void) | undefined;

rl.on('line', (line) => {
    if(waiting_cb != null) {
        waiting_cb(line);
        waiting_cb = undefined;
    } else {
        waiting_strs.push(line);
    }
});

rl.once('close', () => {
    // end of input
    process.exit(0);
});

async function readLine(msg?: string): Promise<string> {
    if(msg != null) process.stdout.write(msg);
    const ws0 = waiting_strs.shift();
    if(ws0 != null) return ws0;
    if(waiting_cb != null) throw new Error("double readline() call");
    return await new Promise<string>(r => waiting_cb = r);
}

function shuffle<T>(array: T[]): void {
    for(let i = 0; i < array.length; i++) {
        const sp = ((Math.random() * (array.length - i)) |0) + i;
        const temp = array[i];
        array[i] = array[sp];
        array[sp] = temp;
    }
}

function fmtcard(card) {
    let [num, suit_in] = card.split(" ");
    let suit;
    if(suit_in === "H") suit = "♡";
    if(suit_in === "S") suit = "♤";
    if(suit_in === "D") suit = "♢";
    if(suit_in === "C") suit = "♧";

    if(suit_in === "D" || suit_in === "H") {
        return "\x1b[1;38;2;255;0;0;48;2;255;255;255m "+num+suit+" \x1b[0m";
    } else {
        return "\x1b[1;38;2;0;0;0;48;2;255;255;255m "+num+suit+" \x1b[0m";
    }
}

async function main() {
    console.log("game start");
    //const name = await readLine("name> ");
    //console.log(name);
    
    const deck = ["H", "D", "S", "C"].flatMap(v => ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].map(q => q+" "+v));
    const discard = [];
    shuffle(deck);
    
    const players = [
        {hand: [], name: "p1"},
        {hand: [], name: "p2"},
    ];
    
    for(const player of players) {
        for(let i = 0; i < 7; i++) {
            player.hand.push(deck.pop());
        }
    }
    
    discard.push(deck.pop());
    
    lp1: while(true) for(const player of players) {
        console.log();
        console.log(player.name+"'s turn");
        console.log("Hand: "+player.hand.map((c,i)=>i+fmtcard(c)).join(" "));
        console.log(fmtcard(discard[discard.length - 1]));
        lp2: while(true) {
        const action = await readLine("cardidx | draw\n> ");
        if(action === "draw") {
            const drawn = deck.pop();
            lp3: while(true) {
            console.log("drew: "+fmtcard(drawn));
            const action2 = await readLine("play | pass\n> ");
            if(action2 === "play") {
                discard.push(drawn);
            }else if(action2 === "pass") {
                player.hand.push(drawn);
            }else{
                console.log("bad");
                continue lp3;
            }
            break;
            }
        }else if(player.hand[+action]) {
            const card = player.hand[+action];
            player.hand.splice(+action, 1);
            discard.push(card);
        }else {
            console.log("bad");
            continue lp2;
        }
        break;
        }
    }
}


main().then(() => {
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});