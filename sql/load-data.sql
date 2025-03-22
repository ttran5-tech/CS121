-- See note below for why I include a table in load-data.sql
DROP TABLE IF EXISTS temp;

-- Load the cards table with csv data
LOAD DATA LOCAL INFILE 'cards.csv'
INTO TABLE cards
FIELDS TERMINATED BY '$'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(name, card_type, level, attribute, archetype, effect);

/* In the csv, the 'level' column is empty for spells and traps, but MySQL
   imports them as 0s anyways. This line converts these values back to NULL. */
UPDATE cards 
SET level = NULL 
WHERE level = 0;

/* I found a csv containing card synergies, but it is quite messy. There are
   synergies between cards and other cards, cards and types, and cards and
   attributes. Thus, I am creating a temporary table to import everything,
   which I delete afterwards. */
CREATE TABLE temp (
    name            VARCHAR(60),
    card_support    VARCHAR(60)
);

-- Load the cards table with csv data
LOAD DATA LOCAL INFILE 'synergies-monster.csv'
INTO TABLE temp
FIELDS TERMINATED BY '$'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

/* Insert direct synergies into synergizes (between a card and another card). */
INSERT INTO synergizes (card_id_first, card_id_second)
    SELECT 
        LEAST(cards.card_id, cards2.card_id) AS card_id_first,
        GREATEST(cards.card_id, cards2.card_id) AS card_id_second
    FROM temp
        NATURAL JOIN cards
        JOIN cards AS cards2 ON card_support = cards2.name
ON DUPLICATE KEY 
    UPDATE card_id_first = card_id_first, card_id_second = card_id_second;

/* Insert attribute synergies into synergizes (between a card and all cards
   of a certain attribute). */
INSERT INTO synergizes (card_id_first, card_id_second)
    SELECT 
        LEAST(cards.card_id, cards2.card_id) AS card_id_first,
        GREATEST(cards.card_id, cards2.card_id) AS card_id_second
    FROM temp
        NATURAL JOIN cards
        JOIN cards AS cards2 ON card_support = cards2.attribute
    WHERE cards.card_id != cards2.card_id
ON DUPLICATE KEY 
    UPDATE card_id_first = card_id_first, card_id_second = card_id_second;

/* Insert card_type synergies into synergizes (between a card and all cards
   of a certain card_type). Must be case insensitive since types are of the 
   form [Type1/type2] (note the difference in cases). */
INSERT INTO synergizes (card_id_first, card_id_second)
    SELECT 
        LEAST(cards.card_id, cards2.card_id) AS card_id_first,
        GREATEST(cards.card_id, cards2.card_id) AS card_id_second
    FROM temp
        NATURAL JOIN cards
        JOIN cards AS cards2 ON LOWER(cards2.card_type) 
            LIKE CONCAT('%', LOWER(temp.card_support), '%')
        WHERE cards.card_id != cards2.card_id
ON DUPLICATE KEY 
    UPDATE card_id_first = card_id_first, card_id_second = card_id_second;
