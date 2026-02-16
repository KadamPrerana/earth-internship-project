import tkinter as tk
import time

def flash_screen():
    root = tk.Tk()
    root.attributes("-fullscreen", True)
    root.attributes("-topmost", True)

    colors = ["white", "black"]  # flash colors

    for i in range(10):  # number of flashes
        root.configure(bg=colors[i % 2])
        root.update()
        time.sleep(0.3)

    root.destroy()

flash_screen()
