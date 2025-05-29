from flask import Flask, jsonify
from flask_cors import CORS
from hltv_async_api import Hltv
import asyncio
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas as rotas

# Configurações
PORT = int(os.getenv('CS2_SERVICE_PORT', 5000))
DEBUG = os.getenv('NODE_ENV') == 'development'

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy", "service": "cs2-api"})

@app.route('/cs2/matches')
def get_cs2_matches():
    try:
        async def fetch_matches():
            async with Hltv() as hltv:
                # Buscar jogos ao vivo e próximos
                matches = await hltv.get_matches(days=1, live=True)
                
                # Formatar resposta
                formatted_matches = []
                for match in matches:
                    formatted_matches.append({
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
                        }
                    })
                
                return formatted_matches
        
        # Executar código assíncrono
        matches = asyncio.run(fetch_matches())
        
        return jsonify({
            'status': 'success',
            'count': len(matches),
            'matches': matches
        })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/cs2/match/<int:match_id>')
def get_match_details(match_id):
    try:
        async def fetch_match_details():
            async with Hltv() as hltv:
                match = await hltv.get_match(match_id)
                
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
        
        # Executar código assíncrono
        match_data = asyncio.run(fetch_match_details())
        
        return jsonify({
            'status': 'success',
            'match': match_data
        })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG) 