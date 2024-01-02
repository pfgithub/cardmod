
/*
I think we can't have intentions
It has to be
- Perform an action
- Validate the action

So eg:
- Can't play? Draw
- Can now play? Play
  - But not if the next person played before you could

And if you have to say a suit, ie 'Hearts'
You have to say it in the right order because if there's another thing asking
for a suit, it will read that one first before the other thing does

No intentions. Just actions.


Now for state management

We can eg list all the allowable actions and describe what happens
when you perform one

Or we can implement methods for validating performed actions

Which route? Sometimes it feels like a mix of both is wanted

*/


type PlayerID = string & {__is_player_id: true};

const CARD_NUMBERS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const CARD_SUITS = ["H", "D", "S", "C"] as const;

type Number = (typeof CARD_NUMBERS)[number];
type Suit = (typeof CARD_SUITS)[number];
type Card = `${string} ${string}`;
type Player = {
    id: PlayerID,
    remaining_to_deal: number,
    hand: Pile,
};
type State = {
    deal_count: number,
    deck: Pile,
    discard: Pile,
    players: Player[],
    v: {
        kind: "dealing"
    } | {
        kind: "turn",
        turn: Player,
    },
};
type Pile = {
    kind: "deck",

    cards: Card[],
} | {
    kind: "discard",

    cards: Card[],
} | {
    kind: "hand",
    for: Player,

    cards: Card[],
} | {
    kind: "temp",

    cards: Card[],
};

// maybe use symbolic actions rather than exact ones?
// ADD_PLAYER_TO_GAME
// DEAL_CARD_TO_PLAYER
// PLAY_CARD_FROM_HAND
// DRAW_CARD
// > PLAY_DRAWN_CARD
// > END_TURN
// ANNOUNCE_SUIT

// act = action
// gam = game action, what the game rules tell a player to do
// int = intention, what a player does on their turn

function act_SHUFFLE_PILE(pile: Pile): void {
    arrayShuffle(pile.cards);
}

function act_MOVE_CARDS(source_pile: Pile, source_index: number, source_count: number, dest_pile: Pile, dest_index: number) {
    const source_cards = source_pile.cards.splice(source_index, source_count);
    dest_pile.cards.splice(dest_index, 0, ...source_cards);
}

// temp piles are deleted when all cards are empty
function act_ADD_TEMP_PILE(): Pile {
    return {kind: "temp", cards: []};
}

function int_ADD_PLAYER_TO_GAME(state: State, player_id: PlayerID, position_index: number): void {
    if(state.v.kind !== "dealing") throw new Error("TODO allow dealing someone in");

    const player: Player = {
        id: player_id,
        remaining_to_deal: state.deal_count,
        hand: undefined as never,
    };
    const player_hand: Pile = {
        kind: "hand",
        for: player,
        cards: [],
    };
    player.hand = player_hand;

    state.players.splice(position_index, 0, player);
}

function gam_DEAL_CARD_TO_PILE(state: State, pile: Pile) {
    if(state.deck.cards.length === 0 && state.discard.cards.length > 1) {
        const temp_pile: Pile = act_ADD_TEMP_PILE();
        act_MOVE_CARDS(state.discard, 0, state.discard.cards.length - 1, temp_pile, 0);
        act_SHUFFLE_PILE(temp_pile);
        act_MOVE_CARDS(temp_pile, 0, temp_pile.cards.length, state.deck, 0);
    }
    if(state.deck.cards.length > 1) {
        act_MOVE_CARDS(state.deck, state.deck.cards.length - 1, 1, pile, Math.max(pile.cards.length - 1, 0));
    }else {
        // can't draw.
    }
}

function gam_CLOCKWISE(state: State, player: Player): Player {
    const index = state.players.indexOf(player);
    return state.players[(index + 1) % state.players.length];
}

function int_DEAL_CARD_TO_PLAYER(state: State, player: Player): void {
    if(player.remaining_to_deal < 1) throw new Error("Player already dealt in");

    player.remaining_to_deal -= 1;
    gam_DEAL_CARD_TO_PILE(state, player.hand);

    return; // success
}

function int_FLIP_AND_START_GAME(state: State, player: Player): void {
    if(state.v.kind !== "dealing") throw new Error("not dealing");

    gam_DEAL_CARD_TO_PILE(state, state.discard);

    const starting_player = gam_CLOCKWISE(state, player);
    state.v = {
        kind: "turn",
        turn: starting_player,
    };

    return; // success
}

function gam_PLAY_CARD(state: State, player: Player, card_index: number): void {
    const to_add_card = player.hand.cards[card_index]!;
    const top_card = state.discard.cards[state.discard.cards.length - 1];
    if(top_card == null) throw new Error("can't play card when no top card")

    act_MOVE_CARDS(player.hand, card_index, 1, state.discard, Math.max(state.discard.cards.length - 1, 0));
}

function int_PLAY_CARD_FROM_HAND(state: State, player: Player, card_index: number): void {
    if(state.v.kind !== "turn") throw new Error("not turn");
    if(state.v.turn !== player) throw new Error("not your turn");

    const card = player.hand.cards[card_index];
    gam_PLAY_CARD(state, player, card_index);
    state.v = {kind: "turn", turn: gam_CLOCKWISE(player)};
}

type Choose<T> = {
    _: T,
};
function chooseNull(): Choose<null> {
    return {_: 0 as never};
}
function choosePlayerID(): Choose<PlayerID> {
    return {_: 0 as never};
}
function chooseEnum<
    T extends {[key: string]: Choose<unknown>}
>(choices: T): Choose<
    {[key in keyof T]: {kind: key, value: T[key]}}[keyof T]
>{
    return 0 as never;
}

async function ask<T>(choice: Choose<T>): T {

}

async function game() {
    const deck: Pile = {kind: "deck", cards: []};
    const discard: Pile = {kind: "discard", cards: []};
    const players: PlayerID[] = [];

    // 1. add players and deal cards
    while(true) {
        const action = await ask(
            chooseEnum({
                player_join: choosePlayerID(),
                deal_to_player: chooseNull(),
                deal_start_card: chooseNull(),
            } as const)
        );
        if(action.kind === "player_join") {
            
        }else if(action.kind === "deal_to_player") {

        }else if(action.kind === "deal_start_card") {

        }
    }
    // 3. deal start card
    // 4. play rounds

    // additional things to add
    // - crazy 8s
    // - allow players to jump in at any time
    // - what if there are two discard piles?
    //   - this means when you choose to play a card, you need to choose the
    //     source card and the discard pile
    //   - that argues for an (action, intention) method
    //   - ie the action is (move card from hand to top of discard) and the
    //      intention is (play card)
}

/*
this is a weird arrangement because generally rules are based on actions
you're allowed to do at times

consider switching back to having a main fn and doing await ask([
    int_PLAY_CARD_FROM_HAND(player),

])

ie on your turn, you can: xyz

so the intention thing is not quite right

crazy 8s rules:

1. Deal 7 cards to each player
2. On your turn:
   - Take one action of:
     - Play a card
     - Draw a card
       - Optionally play the card you just drew
3. Turn order continues right, first player who ends their turn with an empty hand wins

function onAction(action) {
    // dealing: allow the dealer to deal 7 cards to every person in any order
    // allow the dealer to flip the top card once all players are dealt in
}

PLAY A CARD
- You can always play an 8. If you play an 8, say the suit for the next player
- If the top card is an 8, match the suit they said (unless it is the first card)
- The played card must match in suit or number of the top card

DRAW A CARD
- If the deck is empty, reshuffle the discard into the deck but keep the top card
*/


function arrayShuffle<T>(array: T[]): void {
    for(let i = 0; i < array.length; i++) {
        const sp = ((Math.random() * (array.length - i)) |0) + i;
        const temp = array[i];
        array[i] = array[sp];
        array[sp] = temp;
    }
}
export {}