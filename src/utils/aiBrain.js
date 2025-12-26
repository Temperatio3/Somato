import * as tf from '@tensorflow/tfjs';

// Créez et exportez un modèle simple
export const createModel = () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [10] }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  return model;
};

// Fonction pour entraîner le modèle
export const trainModel = async (model, trainingData) => {
  // Compile le modèle
  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  // Exemple de données d'entraînement (à remplacer par vos données)
  const xs = tf.tensor2d([/* vos données d'entrée */]);
  const ys = tf.tensor2d([/* vos sorties attendues */]);

  // Entraînement du modèle
  await model.fit(xs, ys, {
    epochs: 100,
    batchSize: 1,
  });
};

// Fonction pour effectuer une prédiction
export const predict = (model, input) => {
  const prediction = model.predict(tf.tensor2d([input]));
  return prediction.dataSync()[0];
};