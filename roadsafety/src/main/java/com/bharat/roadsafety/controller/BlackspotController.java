package com.bharat.roadsafety.controller;

import com.bharat.roadsafety.model.Blackspot;
import com.bharat.roadsafety.service.BlackspotService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class BlackspotController {

    private final BlackspotService blackspotService;

    public BlackspotController(BlackspotService blackspotService) {
        this.blackspotService = blackspotService;
    }

    @GetMapping("/blackspots")
    public List<Blackspot> getAllBlackspots() {
        return blackspotService.getAllBlackspots();
    }

    @GetMapping("/risk")
    public Blackspot getRisk(@RequestParam Double lat,
                             @RequestParam Double lon) {
        return blackspotService.getRisk(lat, lon);
    }

    // ✅ ADD THIS METHOD
    @PostMapping("/blackspots")
    public Blackspot addBlackspot(@RequestBody Blackspot blackspot) {
        return blackspotService.saveBlackspot(blackspot);
    }
}