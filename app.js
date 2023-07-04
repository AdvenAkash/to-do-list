//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
// const day = date.getDate();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Start DataBase

main().catch((err) => console.log(err));
const itemsSchema = new mongoose.Schema({
  name: String,
});
const listSchema = {
  name: String,
  items: [itemsSchema],
};
const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);
const item1 = new Item({ name: "Welcome to your todolist" });
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.>",
});
const defaultItems = [item1, item2, item3];

async function main() {
  await mongoose.connect("mongodb+srv://admin-akash:Test123@cluster0.ap1lwce.mongodb.net/todolistDB");
  //await mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

  app.get("/", function (req, res) {
    Item.find({})
      .then((foundItem) => {
        if (foundItem.length === 0) {
          return Item.insertMany(defaultItems);
        } else {
          return foundItem;
        }
      })
      .then((savedItem) => {
        res.render("list", {
          listTitle: "Today",
          newListItems: savedItem,
        });
      })
      .catch((err) => console.log(err));
  });
}

// End DataBase

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => console.log(err));
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today") {
    deleteCheckedItem();
  } else {
    deleteCustomItem();
  }

  async function deleteCheckedItem() {
    await Item.deleteOne({ _id: checkedItemId });
    res.redirect("/");
  }

  async function deleteCustomItem() {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );
    res.redirect("/" + listName);
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        //Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list
          .save()
          .then(function () {
            res.redirect("/" + customListName);
          })
          .catch((err) => console.log(err));
      } else {
        // Show List
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => console.log(err));
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
