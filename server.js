// Dependencies
var express = require("express");
var mongojs = require("mongojs");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

// Database configuration
var databaseUrl = "mlbNews";
var collections = ["articles"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");
});

// Retrieve data from the db
app.get("/all", function(req, res) {
  // Sort results from the scrapedData collection in the db in desc. order
  db.scrapedData.find().sort({_id:-1}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      console.log("");
      console.log("-------------------------");
      console.log("");
      res.json(found);
      for(var i = 0; i < found.length; ++i){
        console.log((i + 1) + ": " + found[i].title);
      }
    }
  });
});

var usedCheck;

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  var url = "http://m.mlb.com/"
  // Make a request for the news section of mlb.news
  request("http://m.mlb.com/news/", function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
    // For each element with a "title" class
    $("article").each(function(i, element) {
      // Save the data in variables 
      var title = $(element).attr("data-title");
      var link = url + $(element).attr("data-url");
      var dataID = $(element).attr("data-contentid");
      var author = $(element).attr("data-author");
      var summery = $(element).find(".blurb").find("p").text();
      
      //search the db by the id of the news article
      db.scrapedData.find({"dataID" : dataID}, function(error, found) {
        // Throw any errors to the console
        if (error) {
          console.log(error);
        }
        // If there are no errors, send the data to db
        else {
          //check to see if the search found that id...
          //if it is not there add it in the db
          if (!found.length) {
            console.log(i + " [X] " + title);
            // Insert the data in the scrapedData db
            db.scrapedData.insert({
              title: title,
              link: link,
              dataID: dataID,
              author: author,
              summery: summery,
            });
          } else console.log(i + " [√] " + title);
        } 
      });
    });
  });
  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
  console.log("");
  console.log("-------------------------");
  console.log("");
});


// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
