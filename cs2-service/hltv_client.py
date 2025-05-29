from hltv_async_api import Hltv
import asyncio
from datetime import datetime, timedelta

class HLTVClient:
    def __init__(self):
        self.hltv = None
    
    async def __aenter__(self):
        self.hltv = Hltv()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.hltv:
            await self.hltv.close()
    
    async def get_live_matches(self):
        """Busca jogos ao vivo"""
        async with Hltv() as hltv:
            matches = await hltv.get_matches(days=1, live=True)
            return [match for match in matches if match.live]
    
    async def get_upcoming_matches(self, hours=24):
        """Busca próximos jogos"""
        async with Hltv() as hltv:
            matches = await hltv.get_matches(days=1)
            now = datetime.now()
            return [
                match for match in matches 
                if match.date and match.date > now and match.date < now + timedelta(hours=hours)
            ]
    
    async def get_match_details(self, match_id):
        """Busca detalhes de um jogo específico"""
        async with Hltv() as hltv:
            return await hltv.get_match(match_id)
    
    async def search_team(self, team_name):
        """Busca times por nome"""
        async with Hltv() as hltv:
            teams = await hltv.search_team(team_name)
            return teams
    
    async def get_team_matches(self, team_id):
        """Busca jogos de um time específico"""
        async with Hltv() as hltv:
            return await hltv.get_team_matches(team_id)
    
    def format_match(self, match):
        """Formata um jogo para resposta da API"""
        return {
            'id': match.id,
            'team1': match.team1.name if match.team1 else None,
            'team2': match.team2.name if match.team2 else None,
            'event': match.event.name if match.event else None,
            'date': match.date.isoformat() if match.date else None,
            'stars': match.stars,
            'live': match.live,
            'format': match.format,
            'map': match.map,
            'score': {
                'team1': match.score.team1 if match.score else None,
                'team2': match.score.team2 if match.score else None
            },
            'streams': [{
                'name': stream.name,
                'link': stream.link
            } for stream in match.streams] if match.streams else []
        } 