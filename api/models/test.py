import pickle
# 1. Load the file
path = '../models/api_model.p' # Make sure this path is correct relative to your script
with open(path, 'rb') as f:
    data = pickle.load(f)

# 2. Check the Type
print(f"Type of object: {type(data)}")
print("-" * 30)