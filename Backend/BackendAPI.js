require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to determine brand rating, summary, and ethical score
const getBrandInfoFromProduct = (product) => {
    let rating = "Average";
    let summary = "This brand has room for improvement in sustainability.";
    let ethicalScore = 7; // Default value

    // 1. Use eco-score as primary indicator
    if (product.ecoscore_grade) {
        switch (product.ecoscore_grade) {
            case 'a':
                return {
                    rating: 'Excellent',
                    summary: 'This brand demonstrates excellent environmental practices.',
                    ethicalScore: 9,
                };
            case 'b':
                return {
                    rating: 'Good',
                    summary: 'This brand has good environmental practices.',
                    ethicalScore: 8,
                };
            case 'c':
                return {
                    rating: 'Average',
                    summary: 'This brand has average environmental practices.',
                    ethicalScore: 7,
                };
            case 'd':
            case 'e':
                return {
                    rating: 'Poor',
                    summary: 'This brand has poor environmental practices and needs significant improvement.',
                    ethicalScore: 6,
                };
            default:
                break; // Do nothing, try other criteria
        }
    }

    // 2.  If eco-score is not available, use nutri-score
    if (product.nutrition_grades_tags && product.nutrition_grades_tags.length > 0) {
        switch (product.nutrition_grades_tags[0]) {
            case 'a':
                return {
                    rating: 'Good',
                    summary: 'This brand offers products with good nutritional quality.',
                    ethicalScore: 8,
                };
            case 'b':
                return {
                    rating: 'Average',
                    summary: 'This brand offers products with average nutritional quality.',
                    ethicalScore: 7,
                };
            case 'c':
                return {
                    rating: 'Average',
                    summary: 'This brand offers products with average nutritional quality.',
                    ethicalScore: 7,
                };
            case 'd':
            case 'e':
                return {
                    rating: 'Poor',
                    summary: 'This brand offers products with poor nutritional quality.',
                    ethicalScore: 6,
                };
            default:
                break;
        }
    }

    // 3. If neither eco-score nor nutri-score, use NOVA group
    if (product.nova_group) {
        if (product.nova_group <= 2) {
            return {
                rating: "Good",
                summary: "This brand offers products with minimal processing.",
                ethicalScore: 8,
            };
        } else {
            return {
                rating: "Poor",
                summary: "This brand offers products with ultra-processing.",
                ethicalScore: 6,
            };
        }
    }

    // 4. Default
    return {
        rating: 'Average',
        summary: 'No sustainability data available.',
        ethicalScore: 7,
    };
};

// Route to fetch product sustainability data from Open Food Facts
app.get("/api/product/:barcode", async (req, res) => {
    const { barcode } = req.params;
    try {
        const response = await axios.get(
            `https://world.openfoodfacts.org/api/v2/product/${barcode}`
        );
        if (response.data.status === 1) {
            const product = response.data.product;
            const { rating, summary, ethicalScore } = getBrandInfoFromProduct(product);
            res.json({
                name: product.product_name,
                brands: product.brands,
                ingredients: product.ingredients_text,
                nutrition: product.nutriments,
                sustainability: {
                    labels: product.labels,
                    packaging: product.packaging,
                    eco_score: product.ecoscore_grade || "Unknown",
                },
                brandInfo: {
                    rating,
                    summary,
                    ethicalScore,
                },
            });
        } else {
            res.status(404).json({ error: "Product not found" });
        }
    } catch (error) {
        console.error("Error fetching product data:", error.message);
        res.status(500).json({ error: "Failed to fetch product data" });
    }
});

// Route to return brand sustainability rating
app.get("/api/brand/:name", async (req, res) => {
    const { name } = req.params;
    // In this version, we don't fetch brand info separately.  It's already included in the /api/product/:barcode response.
    //  This route is kept for compatibility, but it now returns a generic response.
    res.json({
        name,
        rating: "Average",
        summary:
            "No specific brand data available.  Please scan a product to get detailed information.",
        ethical_score: 7,
    });
});

// Chatbot response
app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    const { barcode } = req.body; // Get barcode from request

    let reply = "Hmm... I'm still learning. Could you rephrase that?";
    const msg = message.toLowerCase();

    if (msg.includes("hello"))
        reply = "Hey there! 👋 How can I help you shop ethically today?";
    else if (msg.includes("sustainable"))
        reply =
            "Sustainable products are made with care for people and the planet 🌍.";
    else if (msg.includes("recommend"))
        reply =
            "Try brands like Patagonia, Veja, or Allbirds — great ethical choices!";
    else if (msg.includes("thanks") || msg.includes("thank you"))
        reply = "You're welcome! 😊 Stay eco-conscious!";
    else if (msg.includes("goodbye") || msg.includes("bye"))
        reply = "Goodbye! 👋 Have a great day!";
    else if (msg.includes("help"))
        reply = "Sure, I'm here to help! What do you need?";
    else if (msg.includes("amazing") || msg.includes("awesome"))
        reply = "That's great to hear! 😊";
    else if (msg.includes("bad") || msg.includes("terrible"))
        reply = "I'm sorry to hear that. 😔";
    else if (msg.includes("question"))
        reply = "Ask away! I'll do my best to answer.";
    else if (msg.includes("understand"))
        reply = "I'm glad I could help! 👍";
    else if (msg.includes("worried"))
        reply = "I understand your concern.";
    else if (msg.includes("excited"))
        reply = "That's fantastic! 🎉";
    else if (msg.includes("happy"))
        reply = "Great to hear that you are happy 😀";
    else if (msg.includes("sorry"))
        reply = "No problem. I am here to assist."
    else if (msg.includes("frustrated"))
        reply = "I understand. Let me help you with that."
    else if (msg.includes("motivate"))
        reply = "You can do it!"
    else if (msg.includes("inspire"))
        reply = "I hope I can inspire you to learn more."
    else if (msg.includes("educate"))
        reply = "I am happy to educate you."
    else if (msg.includes("inform"))
        reply = "I will provide you with the information you need."
    else if (msg.includes("bbq sauce"))
        reply = "Ah, BBQ sauce! A classic condiment.  Many brands offer organic or low-sugar options, which can be more sustainable.  Always check the ingredients for high fructose corn syrup and artificial flavors!";
    else if (msg.includes("patagonia berries"))
        reply = "Patagonia Berries are often praised for their high antioxidant content.  When considering sustainability, look for berries sourced from farms with fair labor practices and minimal environmental impact.";
    else if (msg.includes("marmite yeast"))
        reply = "Marmite is a concentrated yeast extract.  From a sustainability perspective, it's often considered a byproduct of the brewing industry, which can be seen as a positive form of upcycling.  However, packaging and overall production processes still have an environmental footprint.";
    else if (msg.includes("coca cola"))
        reply = "Coca-Cola is a globally recognized brand.  While they have made some efforts towards sustainability, such as water stewardship and packaging recycling, their overall environmental impact, particularly in terms of plastic waste, remains a significant concern.";
    else if (msg.includes("coffee"))
        reply = "Coffee is a widely consumed beverage with significant sustainability implications.  Look for Fair Trade, organic, or Rainforest Alliance certified coffee to support ethical and environmentally sound practices.";
    else if (msg.includes("chocolate"))
        reply = "Chocolate production can involve issues like deforestation and child labor.  Opt for Fair Trade or UTZ certified chocolate to promote sustainable and ethical sourcing.";
    else if (msg.includes("avocado"))
        reply = "Avocados have become increasingly popular, but their production can be water-intensive and contribute to deforestation in some regions.  Consider the origin of your avocados and look for sustainably farmed options.";
    else if (msg.includes("almond milk"))
        reply = "Almond milk is a popular alternative to dairy milk.  However, almond production is also water-intensive, particularly in drought-prone areas.  Consider alternatives like oat or soy milk, which may have a lower environmental impact, or look for sustainably produced almond milk.";
    else if (msg.includes("salmon"))
        reply = "Salmon is a popular fish, but overfishing and farming practices can have significant environmental consequences.  Look for sustainably sourced or wild-caught salmon certified by organizations like the Marine Stewardship Council (MSC).";
    else if (msg.includes("beef"))
        reply = "Beef production has a high environmental impact due to land use, greenhouse gas emissions, and water consumption.  Consider reducing your beef consumption or choosing grass-fed or sustainably raised beef.";
    else if (msg.includes("chicken"))
        reply = "Chicken production generally has a lower environmental impact than beef, but farming practices can still raise concerns about animal welfare and pollution.  Look for organic or free-range chicken.";
    else if (msg.includes("rice"))
        reply = "Rice is a staple food for much of the world's population.  Its production, particularly flooded rice paddies, contributes significantly to methane emissions.  Consider different rice varieties and farming methods.";
    else if (msg.includes("pasta"))
        reply = "Pasta is a versatile food, and its environmental impact varies depending on the type of grain used (e.g., wheat, durum) and the production process.  Look for pasta made from sustainably grown grains and with minimal packaging.";
    else if (msg.includes("beer"))
        reply = "Beer production involves water use and grain cultivation.  Support breweries that prioritize sustainable practices, such as water conservation, renewable energy use, and responsible sourcing of ingredients.";
    else if (msg.includes("wine"))
        reply = "Wine production can impact the environment through vineyard management, water use, and packaging.  Look for organic or biodynamic wines, and consider wines with lighter packaging.";
    else if (msg.includes("bread"))
        reply = "Bread, a staple food, has an environmental impact that varies depending on the grains used and the baking process.  Consider supporting local bakeries that use sustainably sourced flour.";
    else if (msg.includes("cheese"))
        reply = "Cheese production involves significant resources, especially dairy.  Hard cheeses generally require more milk (and thus resources) than soft cheeses.  Consider cheeses from local farms with sustainable practices.";
    else if (msg.includes("eggs"))
        reply = "Egg production can vary widely in its sustainability.  Free-range and pasture-raised eggs generally have a better environmental and ethical profile than battery-cage eggs.";
    else if (msg.includes("sugar"))
        reply = "Sugar production, particularly from sugarcane, can involve deforestation and habitat destruction.  Look for Fair Trade or organic sugar to support better practices.";
    else if (msg.includes("salt"))
        reply = "Salt mining and production have relatively low environmental impact compared to other food products.  However, consider the packaging and transportation involved.";
    else if (msg.includes("honey"))
        reply = "Honey production relies on healthy bee populations, which are crucial for pollination.  Support local beekeepers who practice sustainable beekeeping.";
    else if (msg.includes("tea"))
        reply = "Tea production can range from large plantations to small-scale farms.  Look for Fair Trade or organic tea to support ethical labor practices and environmentally friendly cultivation.";
    else if (msg.includes("oil"))
        reply = "The production of vegetable oils like palm oil, soy oil, and olive oil can have significant environmental impacts, including deforestation and habitat loss.  Choose sustainably sourced oils.";
    else if (msg.includes("ketchup"))
        reply = "Ketchup, a common condiment, is primarily made from tomatoes.  Consider organic ketchup to avoid pesticides and support sustainable farming.";
    else if (msg.includes("mayonnaise"))
        reply = "Mayonnaise is typically made from eggs, oil, and vinegar.  The environmental impact depends largely on the sourcing of these ingredients.  Look for mayonnaise made with free-range eggs and sustainably sourced oil.";
    else if (msg.includes("mustard"))
        reply = "Mustard seeds are generally a sustainable crop.  However, consider the packaging and any additional ingredients when making a purchase.";
    else if (msg.includes("soy sauce"))
        reply = "Soy sauce production has a relatively low environmental impact, but consider the sourcing of soybeans (deforestation) and the packaging.";

    // Product Description
    else if (msg.includes("describe") && barcode) {
        try {
            const response = await axios.get(
                `https://world.openfoodfacts.org/api/v2/product/${barcode}`
            );
            if (response.data.status === 1) {
                const product = response.data.product;

                const responses = [
                    // Response 1: Combined description
                    `Okay, let's explore this product! It's from ${product.brands || "an unknown brand"}, and here's a quick overview: It contains ${product.ingredients_text || "We couldn't find the ingredients list."} Nutritionally, it has a Nutri-Score of ${product.nutrition_grades_tags ? product.nutrition_grades_tags[0].toUpperCase() : "N/A"}. (Nutri-Score, ranging from A to E, helps you gauge its healthiness based on factors like sugar and fat.) Environmentally, its Eco-Score is ${product.ecoscore_grade || "N/A"}, indicating its impact on our planet. In terms of processing, it's in NOVA Group ${product.nova_group || "N/A"} (NOVA classifies how much a food has been processed). And for a quick nutrient snapshot (per 100g), it has: Fat: ${product.nutriments?.fat ? product.nutriments.fat + "g" : "N/A"}, Saturated Fat: ${product.nutriments?.["saturated-fat"] ? product.nutriments["saturated-fat"] + "g" : "N/A"}, Sugars: ${product.nutriments?.sugars ? product.nutriments.sugars + "g" : "N/A"}, and Salt: ${product.nutriments?.salt ? product.nutriments.salt + "g" : "N/A"}. Anything else you'd like to know?`,

                    // Response 2: Focus on Nutrition
                    `Alright, here's the nutritional lowdown: This product has a Nutri-Score of ${product.nutrition_grades_tags ? product.nutrition_grades_tags[0].toUpperCase() : "N/A"}. (Nutri-Score gives you a quick idea of how healthy a food is, from A to E.) Per 100g, it contains: Fat: ${product.nutriments?.fat ? product.nutriments.fat + "g" : "N/A"}, Saturated Fat: ${product.nutriments?.["saturated-fat"] ? product.nutriments["saturated-fat"] + "g" : "N/A"}, Sugars: ${product.nutriments?.sugars ? product.nutriments.sugars + "g" : "N/A"}, and Salt: ${product.nutriments?.salt ? product.nutriments.salt + "g" : "N/A"}.`,

                    // Response 3: Focus on NOVA Group
                    `Okay, here's a description based on its processing: It's in NOVA Group ${product.nova_group || "N/A"}. (NOVA tells us how much a food has been processed, ranging from minimally processed in Group 1 to ultra-processed in Group 4.)`,

                  // Response 4: Emphasize Eco-Score
                    `This product has an Eco-Score of ${product.ecoscore_grade || "N/A"}. This score tells you how much impact the product has on the environment.`,

                  // Response 5: Just Ingredients
                  `This product contains: ${product.ingredients_text || "We couldn't find the ingredients list."}`,

                  // Response 6: Brand and basic info
                  `This product is from ${product.brands || "an unknown brand"} and is called ${product.product_name || "Product Name N/A"}.`,
                ];

                reply = responses[Math.floor(Math.random() * responses.length)]
            } else {
                reply = "Sorry, I couldn't retrieve the product description.";
            }
        } catch (error) {
            console.error("Error fetching product data:", error.message);
            reply =
                "Sorry, I encountered an error while fetching product details.";
        }
    }
    //Carbon footprint
    else if (msg.includes("footprint")) {
        try {
            const productResponse = await axios.get(
              `https://world.openfoodfacts.org/api/v2/product/${barcode}`
            );
            if (productResponse.data.status === 1) {
              const product = productResponse.data.product;
              const co2Value = product?.ecoscore_data?.agribalyse?.co2_eq_value;
              const co2Unit = product?.ecoscore_data?.agribalyse?.co2_eq_unit;

              if (co2Value && co2Unit) {
                reply = `The carbon footprint of this product is approximately ${co2Value} ${co2Unit}.`;
              } else if (product?.ecoscore_data?.agribalyse) {
                // Construct a more informative message
                let message = "I found some carbon footprint related information, but it may be incomplete. ";
                if (product.ecoscore_data.agribalyse.co2_eq_value) {
                  message += `The CO2 equivalent value is ${product.ecoscore_data.agribalyse.co2_eq_value}. `;
                }
                if (product.ecoscore_data.agribalyse.co2_eq_unit) {
                    message += `The CO2 equivalent unit is ${product.ecoscore_data.agribalyse.co2_eq_unit}.`
                }
                reply = message;

              }
              
              else {
                reply =
                  "Sorry, I couldn't find carbon footprint information for this product.";
              }
            } else {
              reply = "Sorry, I couldn't retrieve the product details.";
            }
          } catch (error) {
            console.error("Error fetching product data:", error.message);
            reply =
              "Sorry, I encountered an error while fetching the carbon footprint.";
          }
    }
     else
        reply = `You said: "${message}" — I'm here to help with sustainability tips! 🌱`;

    res.json({ reply });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

