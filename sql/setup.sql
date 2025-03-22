/* Cleans up existing tables if applicable in an order that respects foreign
   key restraints. */
DROP VIEW IF EXISTS recommended;
DROP TABLE IF EXISTS synergizes;
DROP TABLE IF EXISTS deck;
DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS users;

/* This table holds information for authenticating users based on a password.  
   Passwords are not stored plaintext so that they cannot be used by people 
   that shouldn't have them. Modified from A6 to include a unique user_id, to
   be used to differentiate between different users' decks. */
CREATE TABLE users (
   -- Auto-increments as users are added to database
   user_id          INT            AUTO_INCREMENT,
   -- Usernames are up to 20 characters and must be unique
   username         VARCHAR(20)    NOT NULL,
   -- Salt will be 8 characters all the time, so we can make this 8
   salt             CHAR(8)        NOT NULL,
   -- We use SHA-2 with 256-bit hashes.  MySQL returns the hash
   -- value as a hexadecimal string, which means that each byte is
   -- represented as 2 characters.  Thus, 256 / 8 * 2 = 64.
   -- We can use BINARY or CHAR here; BINARY simply has a different
   -- definition for comparison/sorting than CHAR */
   password_hash    BINARY(64)     NOT NULL,

   PRIMARY KEY(user_id),
   UNIQUE (username)
);

/* Represents current cards uniquely identified by a card_id. Must contain
   non-null card_id, name, and card_type, but may contain null level, attribute,
   archetype, and effect given the different structures of Monster vs. Spell
   or Trap cards. */
CREATE TABLE cards (
   -- Auto-increments as cards are added to database
   card_id      INT            AUTO_INCREMENT,
   -- Includes alphanumeric characters and symbols
   name         VARCHAR(60)    NOT NULL,
   -- e.g. 'Spell', 'Trap', or a Monster type ('Fairy', 'Dragon', etc.)
   card_type    VARCHAR(30)    NOT NULL,
   -- If 'Spell' or 'Trap' card_type, level is NULL
   level        INT,
   -- Includes alphanumeric characters and symbols
   attribute    VARCHAR(30),
   archetype    VARCHAR(30),
   -- May be a long description
   effect       VARCHAR(1000),

   PRIMARY KEY (card_id),
   CHECK (level < 13)
);

/* Represents cards in a deck uniquely identified by a (user_id, deck_position).
   Must contain non-null values. There may only be up to 60 cards in a deck 
   (yet to be implemented). */
CREATE TABLE deck (
   -- Each user has their own deck (limited to one)
   user_id          INT,
   -- Auto-increments as cards are added to deck
   deck_position    INT,
   --
   card_id          INT    NOT NULL,

   PRIMARY KEY (user_id, deck_position),
   FOREIGN KEY (user_id) REFERENCES users(user_id),
   FOREIGN KEY (card_id) REFERENCES cards(card_id)
);

/* Represents pairs of cards that are synergistic uniquely identified by a 
   (card_id_first, card_id_second). Must contain non-null values. For the 
   purposes of unique pairs, card_id_first < card_id_second. */
CREATE TABLE synergizes (
   card_id_first     INT,
   card_id_second    INT,

   PRIMARY KEY(card_id_first, card_id_second),
   FOREIGN KEY (card_id_first) REFERENCES cards(card_id),
   FOREIGN KEY (card_id_second) REFERENCES cards(card_id),
   CHECK (card_id_first <= card_id_second)
);

/* Creates a view of recommended cards for all users. */
CREATE VIEW recommended AS
   SELECT deck.user_id, cards.card_id, 
          -- Heuristic for calculating score. Score is determined using
          -- weighted sums of different properties. Cards that synergize are
          -- arbitrarily assigned a weight of 10, archetypes that are the same
          -- are arbitarily assigned a weight of 5, and card_types that are the
          -- same are arbitrarily assigned a weight of 3. Thus, the raw scores
          -- don't really mean anything; it is the relative difference between
          -- scores that determine which cards are recommended (e.g. the cards
          -- with the top 10 highest scores).
          (SUM(has_synergy(deck.card_id, cards.card_id)) * 10) +
          (SUM(has_same_archetype(deck.card_id, cards.card_id)) * 5) +
          (SUM(has_same_card_type(deck.card_id, cards.card_id)) * 3) AS score
   FROM deck
      JOIN cards ON deck.card_id != cards.card_id
      -- We don't recommend cards that are already in the user's deck
      LEFT JOIN deck AS deck2 
         ON deck2.user_id = deck.user_id 
         AND deck2.card_id = cards.card_id
   WHERE deck2.card_id IS NULL
   GROUP BY user_id, cards.card_id
   HAVING score > 0
   ORDER BY user_id, score DESC;
   
/* Creates an index on card_type to speed up filtering operations */
CREATE INDEX idx_card_type
ON cards(card_type);
