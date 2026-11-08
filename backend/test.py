import matplotlib.pyplot as plt

phi = [
    0,
    110,
    96.8,
    70.4,
    -1.885714,
    0
]
points = [
    "D (начало)","После E1","После r1","После R1","После R6","D (конец)"
]
x = range(len(phi))

plt.figure(figsize=(12, 6))

plt.plot(x, phi,marker="o",linewidth=2.5,markersize=8,color="blue")
plt.axhline(0, color="black", linewidth=1)
plt.grid(True, linestyle="--", alpha=0.5)

for i, value in enumerate(phi):
    plt.annotate(
        f"{value:.3f} В",(i, value),xytext=(0, 12),textcoords="offset points",ha="center",fontsize=10)

plt.xticks(x, points, rotation=15)
plt.xlabel("Участки электрической цепи")
plt.ylabel("Потенциал φ, В")
plt.title("Потенциальная диаграмма электрической цепи\n""Практическая работа №1 — Вариант 5"
)

plt.tight_layout()
plt.savefig("potential_diagram_variant5.png", dpi=300)
plt.show()

print("Диаграмма сохранена: potential_diagram_variant5.png")