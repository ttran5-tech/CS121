I got my data from an online Yu-Gi-Oh cardlists scraper at 
https://github.com/Pietracoops/yugioh_cardlist_scraper. Of course, I still had
to perform a lot of preprocessing such as selecting only classic Yu-Gi-Oh cards,
filtering out unnecessary columns, and dealing with messy data in general.

To load my data, head to the 'sql' directory located in the overall directory.
Then, execute these four commands in MySQL in order:
SOURCE setup-routines.sql;
SOURCE setup-passwords.sql;
SOURCE setup.sql;
SOURCE load-data.sql;

To run my website, install all the required npm packages, indicated by 
package.json. Then run this command in the terminal:
nodemon app.js

Though all major features are completed (namely the deck building and card
recommenation systems), my website is currently a bit unpolished, with a
placeholder image serving as images for all the cards in the new database 
(though the images for cards in the older, non-SQL database still exist).
Additionally, not all new functions have had documentation written for them.
Finally, the "card recommender" tab is now deprecated after the introduction of
the new "deck builder" tab that serves as both, but I did not have the time to
fully remove it.
