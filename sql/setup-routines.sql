-- Drops functions and procedures
DROP FUNCTION IF EXISTS has_synergy;
DROP FUNCTION IF EXISTS has_same_archetype;
DROP FUNCTION IF EXISTS has_same_card_type;
DROP PROCEDURE IF EXISTS sp_add_card;

/* A UDF that checks if two cards synergize with each other (i.e. there is
   an entry (card_id_first, card_id_second) in the synergizes table). */
DELIMITER !

CREATE FUNCTION has_synergy (card_id_first INT, card_id_second INT) 
    RETURNS BOOLEAN DETERMINISTIC
BEGIN
    -- Checks if the entry exists in the synergizes table (order insensitive)
    IF EXISTS (
        SELECT card_id_first
        FROM synergizes AS s
        WHERE (s.card_id_first = card_id_first 
               AND s.card_id_second = card_id_second)
        OR (s.card_id_first = card_id_second
            AND s.card_id_second = card_id_first)
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END !

DELIMITER ;

/* A UDF that checks if two cards have the same archetype. */
DELIMITER !

CREATE FUNCTION has_same_archetype (card_id_first INT, card_id_second INT) 
    RETURNS BOOLEAN DETERMINISTIC
BEGIN
    DECLARE archetype_first VARCHAR(30);
    DECLARE archetype_second VARCHAR(30);

    SELECT archetype INTO archetype_first
    FROM cards
    WHERE card_id = card_id_first;

    SELECT archetype INTO archetype_second
    FROM cards
    WHERE card_id = card_id_second;

    -- Check if the archetypes are the same
    IF archetype_first = archetype_second THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END !

DELIMITER ;

/* A UDF that checks if two cards have the same type. */
DELIMITER !

CREATE FUNCTION has_same_card_type (card_id_first INT, card_id_second INT) 
    RETURNS BOOLEAN DETERMINISTIC
BEGIN
    DECLARE card_type_first VARCHAR(30);
    DECLARE card_type_second VARCHAR(30);

    SELECT card_type INTO card_type_first
    FROM cards
    WHERE card_id = card_id_first;

    SELECT card_type INTO card_type_second
    FROM cards
    WHERE card_id = card_id_second;

    -- Check if the card_types are the same
    IF card_type_first = card_type_second THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END !

DELIMITER ;

/* A procedure that checks whether a deck already has 60 cards or 4 copies of
   the same card. Throws an error if these conditions are met and add the card
   with the given card_id to the deck given by user_id otherwise.  */
DELIMITER !

CREATE PROCEDURE sp_add_card (user_id INT, card_id INT) 
BEGIN
    DECLARE deck_size INT DEFAULT 0;
    DECLARE num_copies INT DEFAULT 0;
    
    SELECT COUNT(*)
    FROM deck
    WHERE deck.user_id = user_id
    INTO deck_size;

    SELECT COUNT(*)
    FROM deck
    WHERE deck.user_id = user_id
        AND deck.card_id = card_id
    INTO num_copies;

    -- Cannot have more than 4 copies of the same card in a deck
    IF num_copies = 4 THEN
        SIGNAL SQLSTATE '45000';
    END IF;

    -- Cannot have more than 60 cards in a deck
    IF deck_size = 60 THEN
        SIGNAL SQLSTATE '45000';
    END IF;

    INSERT INTO deck (user_id, deck_position, card_id) VALUES
        (user_id, deck_size + 1, card_id);
END !

DELIMITER ;