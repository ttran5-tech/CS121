/* Adapted from Adoption Application demo in Lecture 19. */
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'adminpw';
CREATE USER 'client'@'localhost' IDENTIFIED BY 'clientpw';
-- Can add more users or refine permissions
GRANT ALL PRIVILEGES ON yugioh.* TO 'admin'@'localhost';
GRANT SELECT ON yugioh.* TO 'client'@'localhost';
FLUSH PRIVILEGES;
