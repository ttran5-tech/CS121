/* Cleans up existing tables, functions, and procedures if applicable in an 
   appropriate order. */
--
DROP FUNCTION IF EXISTS make_salt;
DROP FUNCTION IF EXISTS authenticate;
--
DROP PROCEDURE IF EXISTS sp_add_user;
DROP PROCEDURE IF EXISTS sp_change_password;

/* This function generates a specified number of characters for using as a
   salt in passwords. */
DELIMITER !
CREATE FUNCTION make_salt(num_chars INT)
RETURNS VARCHAR(20) DETERMINISTIC
BEGIN
    DECLARE salt VARCHAR(20) DEFAULT '';

    -- Don't want to generate more than 20 characters of salt.
    SET num_chars = LEAST(20, num_chars);

    -- Generate the salt!  Characters used are ASCII code 32 (space)
    -- through 126 ('z').
    WHILE num_chars > 0 DO
        SET salt = CONCAT(salt, CHAR(32 + FLOOR(RAND() * 95)));
        SET num_chars = num_chars - 1;
    END WHILE;

    RETURN salt;
END !
DELIMITER ;

/* Adds a new user to the users table, using the specified password (max
   of 20 characters). Salts the password with a newly-generated salt value,
   and then the salt and hash values are both stored in the table. */
DELIMITER !
CREATE PROCEDURE sp_add_user(new_username VARCHAR(20), password VARCHAR(20))
BEGIN
    DECLARE salt CHAR(8);
    DECLARE final_password BINARY(64);

    SELECT make_salt(8)
    INTO salt;

    SELECT SHA2(CONCAT(salt, password), 256)
    INTO final_password;

    INSERT INTO users (username, salt, password_hash)
    VALUES
        (new_username, salt, final_password);
END !
DELIMITER ;

/* Authenticates the specified username and password against the data
   in the users table.  Returns 1 if the user appears in the table, and the
   specified password hashes to the value for the user. Otherwise returns 0. */
DELIMITER !
CREATE FUNCTION authenticate(username VARCHAR(20), password VARCHAR(20))
RETURNS TINYINT DETERMINISTIC
BEGIN
    DECLARE user_salt CHAR(8);
    DECLARE calculated_password BINARY(64);
    DECLARE stored_password BINARY(64);

    SELECT salt
    FROM users
    WHERE users.username = username
    INTO user_salt;

    IF user_salt IS NULL THEN
        RETURN 0;
    END IF;

    SELECT SHA2(CONCAT(user_salt, password), 256)
    INTO calculated_password;

    SELECT password_hash
    FROM users
    WHERE users.username = username
    INTO stored_password;

    IF calculated_password = stored_password THEN
        RETURN 1;
    END IF;

    RETURN 0;
END !
DELIMITER ;

/* Create a procedure sp_change_password to generate a new salt and change the 
   given user's password to the given password (after salting and hashing) */
DELIMITER !
CREATE PROCEDURE sp_change_password(username VARCHAR(20), 
                                    new_password VARCHAR(20))
BEGIN
    DECLARE new_salt CHAR(8);
    DECLARE final_password BINARY(64);

    SELECT make_salt(8)
    INTO new_salt;

    SELECT SHA2(CONCAT(new_salt, new_password), 256)
    INTO final_password;

    UPDATE users
    SET salt = new_salt, password_hash = final_password
    WHERE users.username = username;
END !
DELIMITER ;
