# backend/ml_models/custom_layers.py

import tensorflow as tf
from tensorflow.keras import layers # type: ignore # Corrected from keras import layers

class AttentionLayer(layers.Layer):
    def __init__(self, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)

    def build(self, input_shape):
        # Ensure input_shape has the expected number of dimensions
        if len(input_shape) != 3:
            raise ValueError(f"Expected 3D input (batch, timesteps, features), but got input_shape {input_shape}")
        
        self.W = self.add_weight(name='attention_weight',
                                 shape=(input_shape[2], 1), # input_shape[2] is num_features
                                 initializer='glorot_uniform', # Keras default 'normal' can sometimes be problematic
                                 trainable=True)
        self.b = self.add_weight(name='attention_bias',
                                 shape=(input_shape[1], 1), # input_shape[1] is num_timesteps
                                 initializer='zeros',
                                 trainable=True)
        super(AttentionLayer, self).build(input_shape)

    def call(self, inputs):
        # inputs shape: (batch_size, time_steps, features)
        # e = K.tanh(K.dot(x, self.W) + self.b)
        e = tf.keras.activations.tanh(tf.matmul(inputs, self.W) + self.b)  # Attention scores
        # e shape: (batch_size, time_steps, 1)

        # a = K.softmax(e, axis=1)
        a = tf.keras.activations.softmax(e, axis=1)  # Softmax for attention weights along time_steps
        # a shape: (batch_size, time_steps, 1)

        # output = x * a
        output = inputs * a  # Apply attention weights (element-wise multiplication)
        # output shape: (batch_size, time_steps, features)

        # To get a context vector, you typically sum over the time_steps dimension
        # context_vector = tf.reduce_sum(output, axis=1) #  shape: (batch_size, features)
        # return context_vector
        
        # The notebook's original AttentionLayer returns the weighted sequence.
        # If your LSTM expects the full weighted sequence, this is correct.
        # If it expects a context vector, you'd sum as above.
        # For now, keeping it as in the notebook.
        return output

    def get_config(self):
        # Implement get_config to allow model saving/loading with this custom layer
        config = super(AttentionLayer, self).get_config()
        # Add any custom parameters here if your __init__ had them
        return config
