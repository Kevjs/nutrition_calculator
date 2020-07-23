const ingredients_info = require("./Ingredient_information.json");

const recepy_json_file = process.argv[2];
const recepy = require(`./${recepy_json_file}`);

let total_nutrition = {
  Calories: 0,
  Fats: {
    Total: 0,
    "Saturated Fat": 0,
    "Trans Fat": 0,
  },
  Cholesterol: 0,
  Sodium: 0,
  Carbs: {
    Total: 0,
    Fiber: 0,
    Sugars: 0,
  },
  Protein: 0,
};

const func_obj = (object, func, location = "") => {
  for (let [key, value] of Object.entries(object)) {
    if (Array.isArray(object[key])) {
      for (let item in object[key]) {
        object[key][item] = func(
          object[key][item],
          location + key + "|" + item
        );
      }
    } else if (typeof object[key] === "object") {
      func_obj(object[key], func, location + key + "|");
    } else {
      object[key] = func(object[key], location + key);
    }
  }
};

const setup_func = () => {
  let multiplier = 0;
  let ingredient_nutrition_values = {};

  const set_multiplier = (val) => (multiplier = val);
  const set_ingredient_nutrition_values = (val) =>
    (ingredient_nutrition_values = val);

  const calculate_nutrition_from_ingredient_value = (val, location) => {
    let cp = { ...ingredient_nutrition_values };

    const loc_array = location.split("|");
    const last = loc_array.pop();

    for (let key of loc_array) {
      cp = cp[key];
    }

    return val + cp[last] * multiplier;
  };

  return {
    set_multiplier,
    set_ingredient_nutrition_values,
    calculate_nutrition_from_ingredient_value,
  };
};

const multiplier_func = setup_func();

for (let item of recepy["Ingredient List"]) {
  let using = undefined;
  const test = ingredients_info.filter(
    (element) => element.ingredient === item.Ingredient
  );
  if (test.length === 0) {
  } else if (test.length === 1) {
    const found = test[0];
    using = found;
    // if (found.brand === item.brand) {
    // } else if (found.brand === "Generic" && item.brand != "Generic") {
    // } else {
    // }
  } else {
    const find_by_brand = test.filter(
      (element) => element.brand === item.brand
    );
    if (find_by_brand === 1) {
      using = find_by_brand[0];
    } else if (find_by_brand > 1) {
      using = find_by_brand[0];
    } else {
      const find_generic = test.filter(
        (element) => element.brand === "Generic"
      );
      if (find_generic.length === 0) {
        const random_chose = Math.floor(Math.random() * test.length()) - 1;
        using = test[random_chose];
      } else {
        using = find_generic[0];
      }
    }
  }

  if (!!using) {
    let using_quantity = using.amount.split(" ")[0].split(",");
    let using_quantity_type = using.amount.split(" ")[1];
    let item_quantity = item.Amount.split(" ")[0].split(",");
    let item_quantity_type = item.Amount.split(" ")[1];
    let temp = 0;

    item_quantity.map((val) => (temp += eval(val)));
    item_quantity = temp;
    temp = 0;
    using_quantity.map((val) => (temp += eval(val)));
    using_quantity = temp;

    let multiplier = 0;

    if (item_quantity_type === "Cup") item_quantity *= 16;
    else if (item_quantity_type === "Tsp") item_quantity /= 3;
    else if (item_quantity_type === "Ml") item_quantity *= 0.067628;
    else if (item_quantity_type === "L") item_quantity *= 67.628;

    if (using_quantity_type === "Cup") using_quantity *= 16;
    else if (using_quantity_type === "Tsp") using_quantity /= 3;
    else if (using_quantity_type === "Ml") using_quantity *= 0.067628;
    else if (using_quantity_type === "L") using_quantity *= 67.628;

    multiplier = item_quantity / using_quantity;

    multiplier_func.set_ingredient_nutrition_values(using.nutrition);
    multiplier_func.set_multiplier(multiplier);
    func_obj(
      total_nutrition,
      multiplier_func.calculate_nutrition_from_ingredient_value
    );

    console.log(`${item.Ingredient}\nTotal Running Nutrition`);
    console.log(total_nutrition);
  } else {
    console.log(`${item.Ingredient} not found`);
  }
}

console.log("Total nutrition is:");
console.log(total_nutrition);
console.log("Nutrition per serving:");

const servings = recepy["Resulting Servings"];
let serving_nutrition = { ...total_nutrition };
const divide_by_servings = (val) => {
  return val / servings;
};
func_obj(serving_nutrition, divide_by_servings);
console.log(serving_nutrition);
