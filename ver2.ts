
type PlayerID = string & {__is_player_id: true};
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
}

/*
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