-- Show card database
SELECT card_id, name, card_type, level, attribute, archetype, effect
FROM cards;

-- Show card given card_id
SELECT name, card_type, level, attribute, archetype, effect
FROM cards
WHERE card_id = 1;  -- could be any card_id

-- Show the user's deck (given a user_id)
SELECT card_id, name, card_type, level, attribute, archetype, effect
FROM deck
    NATURAL JOIN cards 
WHERE user_id = 1  -- could be any user id
ORDER BY deck_position;

-- Show the recommended cards for a user (given a user_id), in descending order
SELECT card_id, name, card_type, level, attribute, archetype, effect
FROM cards
    NATURAL JOIN recommended
WHERE user_id = 1  -- could be any user id
ORDER BY score DESC;
