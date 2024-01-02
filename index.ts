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

type Number = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Suit = "H" | "S" | "D" | "C";
type Card = `${string} ${string}`;

function fmtcard(card: Card) {
    let [num, suit_in] = card.split(" ");
    let suit;
    if(suit_in === "H") suit = "♡";
    if(suit_in === "S") suit = "♤";
    if(suit_in === "D") suit = "♢";
    if(suit_in === "C") suit = "♧";

    if(suit_in === "D" || suit_in === "H") {
        return "\x1b[1;38;5;196;48;5;255m "+num+suit+" \x1b[0m";
    } else {
        return "\x1b[1;38;5;232;48;5;255m "+num+suit+" \x1b[0m";
    }
}

type Player = {
    hand: Card[],
    name: string,
};
type State = {
    // consider referring to a stack id instead of Card[]
    deck: Card[],
    discard: Card[],
    eight_suit: Suit | null,
    players: Player[],
};
function decomposeCard(card: Card): [Suit, Number] {
    return card.split(" ") as [Suit, Number];
}
function checkPlayable(state: State, card: Card): boolean {
    const top_of_discard = state.discard[state.discard.length - 1];
    const [td_suit, td_num] = decomposeCard(top_of_discard);
    const [sd_suit, sd_num] = decomposeCard(card);
    if(sd_num === "8") return true;
    if(td_num === "8") return sd_suit === state.eight_suit;
    if(td_suit === sd_suit || td_num === sd_num) {
        return true;
    }
    return false;
}

function draw(state: State): Card | null {
    if(state.deck.length === 0) {
        reshuffleDiscardIntoDeck(state);
    }
    return state.deck.pop() ?? null;
}

function reshuffleDiscardIntoDeck(state: State) {
    if(state.discard.length - 1 < 0) return;
    const discard_vals = state.discard.splice(0, state.discard.length - 1);
    shuffle(discard_vals);
    for(const dv of discard_vals) state.deck.unshift(dv);
}

function DRAW_CARD(state: State, player: Player) {
    const drawn_card = draw(state);
    if(drawn_card == null) return; // guess you don't have to draw
    player.hand.push(drawn_card);
}

async function main() {
    console.log("game start");
    //const name = await readLine("name> ");
    //console.log(name);

    const state: State = {
        deck: ["H", "D", "S", "C"].flatMap(v => ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].map(q => q+" "+v as Card)),
        discard: [],
        eight_suit: null,
        players: [
            {hand: [], name: "p1"},
            {hand: [], name: "p2"},
        ],
    };
    
    shuffle(state.deck);
    
    for(let i = 0; i < 7; i++) {
        for(const player of state.players) {
            DRAW_CARD(state, player);
        }
    }
    
    const first_discard = draw(state);
    if(first_discard != null) state.discard.push(first_discard);
    
    lp1: while(true) for(const player of state.players) {
        console.log();
        console.log(player.name+"'s turn");
        console.log("Hand: "+player.hand.map((c,i)=>i+fmtcard(c)).join(" "));
        console.log(fmtcard(state.discard[state.discard.length - 1]));
        lp2: while(true) {
        const action = await readLine("cardidx | draw\n> ");
        if(action === "draw") {
            const drawn = draw(state);
            if(drawn == null) break; // guess you don't have to draw
            lp3: while(true) {
            console.log("drew: "+fmtcard(drawn));
            const playable = checkPlayable(state, drawn);
            const action2 = playable ? await readLine("play | pass\n> ") : "pass";
            if(action2 === "play") {
                state.discard.push(drawn);
            }else if(action2 === "pass") {
                player.hand.push(drawn);
            }else{
                console.log("bad");
                continue;
            }
            break;
            }
        }else if(player.hand[+action]) {
            const card = player.hand[+action];
            if(checkPlayable(state, card)) {
                player.hand.splice(+action, 1);
                state.discard.push(card);
            }else{
                console.log("can't play that");
                continue;
            }
        }else {
            console.log("bad");
            continue;
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

export {}