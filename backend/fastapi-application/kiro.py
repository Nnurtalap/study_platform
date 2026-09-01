from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:20128/v1",
    api_key="sk-a7f7c411a120e7fa-231d1b-3d502ece"
)

response = client.chat.completions.create(
    model="auto",
    messages=[
        {
            "role": "user",
            "content": "Привет! Расскажи мне про Python"
        }
    ]
)

print(response.choices[0].message.content)