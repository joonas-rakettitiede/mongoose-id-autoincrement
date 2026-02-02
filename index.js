const mongoose = require('mongoose');
const incrementSchema = new mongoose.Schema({
  model: String,
  count: Number
});
var Increment;
exports.initialize = function (connection, modelName) {
  var model = modelName || 'Increment';
  try {
    Increment = connection.model(model);
  } catch (ex) {
    if (ex.name === 'MissingSchemaError') {
      Increment = connection.model(model, incrementSchema);
    }
    else
      throw ex;
  }
};

exports.plugin = function (schema, options) {
  if (!incrementSchema || !Increment) throw new Error("mongoose-id-autoincrement has not been initialized");

  // var settings = {
  //   model: null, // The model to configure the plugin for.
  //   field: '_id', // The field the plugin should track.
  //   unique: true // Should we create a unique index for the field
  // },

  var settings = options;

  const model = settings.model;
  var fields = {};
  fields[settings.field] = {
    type: Number,
    require: true,
    unique: settings.unique
  };
  schema.add(fields);

  schema.pre('save', async function (next) {
    if (this.isNew) {
      try {
        const increment = await Increment.findOneAndUpdate(
          { model: model },
          { $inc: { count: 1 } },
          { new: true, upsert: true }
        );

        this[settings.field] = increment.count; // Assign the unique_id here
        next(); // Proceed after the field is updated
      } catch (err) {
        next(err); // Pass any errors to the next middleware
      }
    } else {
      next();
    }
  });
}

